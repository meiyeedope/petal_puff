import hashlib
import json
import os
from contextlib import asynccontextmanager
from datetime import date, timedelta
from pathlib import Path
from typing import Literal, Optional
from uuid import UUID, uuid4

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import JSON, Column, Integer, String, create_engine, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import DeclarativeBase, Session

#Load product catalogue
CATALOG_PATH = Path(os.getenv('CATALOG_PATH', str(Path(__file__).parent.parent / 'frontend/src/catalog.json')))
CATALOG = json.loads(CATALOG_PATH.read_text())

#Connect to MariaDB
DATABASE_URL = os.getenv('DATABASE_URL')

engine = create_engine(DATABASE_URL, pool_pre_ping=True) #create the thing i will use to talk to my DB

#Define database tables
class Base(DeclarativeBase): #create a parent class
    pass

class SavedDesign(Base):
    __tablename__ = 'designs'
    id = Column(String(36), primary_key=True)
    payload = Column(JSON, nullable=False)
    subtotal = Column(Integer, nullable=False)

class Order(Base):
    __tablename__ = 'orders'
    id = Column(String(36), primary_key=True)
    request_id = Column(String(36), unique=True, nullable=False)
    fingerprint = Column(String(64), nullable=False)
    payload = Column(JSON, nullable=False)
    subtotal = Column(Integer, nullable=False)
    delivery = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, default='draft')

#Define valid API data
@asynccontextmanager
async def lifespan(app: FastAPI): #fastapi starts, check or create tables if not exists in db. yield, startup work is done let fastapi app run normally
    Base.metadata.create_all(engine)
    yield

app = FastAPI(title='Petal Puff API', version='0.1.0', lifespan=lifespan)

#validation
class Stem(BaseModel):
    uid: UUID
    id: str
    color: str = Field(pattern=r'^#[0-9a-fA-F]{6}$')
    x: float = Field(ge=0, le=500, allow_inf_nan=False)
    y: float = Field(ge=0, le=600, allow_inf_nan=False)
    rotation: float = Field(ge=-360, le=360, allow_inf_nan=False)

class PlushiePosition(BaseModel):
    x: float = Field(default=250, ge=100, le=400, allow_inf_nan=False)
    y: float = Field(default=240, ge=170, le=320, allow_inf_nan=False)

class Design(BaseModel):
    size: str
    flowers: list[Stem] = Field(max_length=10)
    wrapping: str
    color: str = Field(pattern=r'^#[0-9a-fA-F]{6}$')
    ribbon: str
    plushie: PlushiePosition = Field(default_factory=PlushiePosition)
    layer_order: list[str] = Field(default_factory=list)
    extras: list[str] = Field(max_length=3)
    message: str = Field(default='', max_length=300)
    delivery_date: str = ''
    delivery_method: Literal['delivery', 'collection'] = 'delivery'

    @model_validator(mode='after')
    def validate_choices(self):
        def known(group, value):
            found = next((x for x in CATALOG[group] if x['id'] == value), None)
            if not found:
                raise ValueError(f'Unknown {group} selection: {value}')
            return found
        size = known('sizes', self.size)
        known('wrappings', self.wrapping)
        known('ribbons', self.ribbon)
        for f in self.flowers:
            known('flowers', f.id)
        for extra in self.extras:
            known('extras', extra)
        if len(set(self.extras)) != len(self.extras):
            raise ValueError('Extras cannot be duplicated')
        if sum(extra in {'bear', 'bunny'} for extra in self.extras) > 1:
            raise ValueError('Choose at most one plushie')
        valid_layers = {str(f.uid) for f in self.flowers}
        if any(extra in {'bear', 'bunny'} for extra in self.extras):
            valid_layers.add('plushie')
        if len(set(self.layer_order)) != len(self.layer_order):
            raise ValueError('Layer order cannot contain duplicates')
        if any(layer not in valid_layers for layer in self.layer_order):
            raise ValueError('Layer order contains an unknown item')
        if len({f.uid for f in self.flowers}) != len(self.flowers):
            raise ValueError('Each stem must have a unique ID')
        if len(self.flowers) > size['capacity']:
            raise ValueError('Too many flowers for this bouquet size')
        if self.delivery_date:
            try:
                date.fromisoformat(self.delivery_date)
            except ValueError:
                raise ValueError('Use YYYY-MM-DD for the delivery date')
        return self

class DesignRequest(BaseModel):
    design: Design

class CartItem(BaseModel):
    uid: UUID
    product_id: Optional[str] = None
    design: Optional[Design] = None
    quantity: int = Field(ge=1, le=20, strict=True)

    @model_validator(mode='after')
    def exactly_one(self):
        if (self.product_id is None) == (self.design is None):
            raise ValueError('Provide exactly one product_id or design')
        if self.product_id is not None and not any(p['id'] == self.product_id for p in CATALOG['products']):
            raise ValueError('Unknown product')
        if self.design:
            if not self.design.flowers:
                raise ValueError('An order needs at least one flower')
            if self.design.delivery_date and date.fromisoformat(self.design.delivery_date) < date.today() + timedelta(days=3):
                raise ValueError('Please allow at least three days for handcrafting')
        return self

class OrderRequest(BaseModel):
    request_id: UUID
    items: list[CartItem] = Field(min_length=1, max_length=50)

    @model_validator(mode='after')
    def unique_items(self):
        if len({item.uid for item in self.items}) != len(self.items):
            raise ValueError('Cart line IDs must be unique')
        return self

#calculates prices 
def price(group, item_id): #price lookup
    return next(x['price'] for x in CATALOG[group] if x['id'] == item_id)

def quote(design): #bouquet total calculation
    return sum(price('flowers', f.id) for f in design.flowers) + price('wrappings', design.wrapping) + price('ribbons', design.ribbon) + sum(price('extras', e) for e in design.extras)

#API endpoints
@app.get('/api/health')
def health():
    with engine.connect() as conn:
        conn.execute(text('SELECT 1')) #sql 
    return {'status': 'ok', 'database': engine.dialect.name}

@app.get('/api/catalog')
def catalog():
    return CATALOG

@app.post('/api/quote')
def get_quote(body: DesignRequest):
    subtotal = quote(body.design)
    delivery = CATALOG['delivery'] if body.design.delivery_method == 'delivery' else 0
    return {'currency': 'SGD', 'subtotal': subtotal, 'delivery': delivery, 'total': subtotal + delivery}

@app.post('/api/designs', status_code=201)
def save_design(body: DesignRequest):
    with Session(engine) as session:
        row = SavedDesign(id=str(uuid4()), payload=body.design.model_dump(mode='json'), subtotal=quote(body.design))
        session.add(row)
        session.commit()
        return {'id': row.id, 'subtotal': row.subtotal, 'currency': 'SGD'}

@app.get('/api/designs/{design_id}')
def get_design(design_id: UUID):
    with Session(engine) as session:
        row = session.get(SavedDesign, str(design_id))
        if not row:
            raise HTTPException(404, 'Design not found')
        return {'id': row.id, 'design': row.payload, 'subtotal': row.subtotal}

def order_result(row):
    return {'id': row.id, 'status': row.status, 'currency': 'SGD', 'subtotal': row.subtotal, 'delivery': row.delivery, 'total': row.subtotal + row.delivery}

@app.post('/api/orders', status_code=201)
def save_order(body: OrderRequest):
    payload = [item.model_dump(mode='json') for item in body.items]
    fingerprint = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
    with Session(engine) as session:
        existing = session.scalar(select(Order).where(Order.request_id == str(body.request_id)))
        if existing:
            if existing.fingerprint != fingerprint:
                raise HTTPException(409, 'This request ID was used for a different cart. Please start a new request.')
            return order_result(existing)
        subtotal = sum((quote(i.design) if i.design else price('products', i.product_id)) * i.quantity for i in body.items)
        delivery = CATALOG['delivery'] if any(not i.design or i.design.delivery_method == 'delivery' for i in body.items) else 0
        row = Order(id=str(uuid4()), request_id=str(body.request_id), fingerprint=fingerprint, payload=payload, subtotal=subtotal, delivery=delivery, status='draft')
        session.add(row)
        try:
            session.commit()
        except IntegrityError:
            session.rollback()
            existing = session.scalar(select(Order).where(Order.request_id == str(body.request_id)))
            if not existing or existing.fingerprint != fingerprint:
                raise HTTPException(409, 'Request ID conflict')
            return order_result(existing)
        return order_result(row)
