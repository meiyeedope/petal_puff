## Application tools 
React + typescript \
FastAPI \
MariaDB

## Starts the app through docker with React, FastAPI, MariaDB
docker compose up --build \
link : http://localhost:8080 \
docs: http://localhost:8000/docs

## Stop the app 
docker compose down

## Frontend-only preview. no backend
cd frontend \
npm ci \
npm run dev \
link : http://localhost:5173

## Local virtual machine
python3 -m venv .venv \
source .venv/bin/activate \
pip install -r backend/requirements.txt

| File                        | Purpose                                                                      |
| --------------------------- | ---------------------------------------------------------------------------- |
| `frontend/Dockerfile`           | tells docker how to build the frontend container for react app. Node builds website for react but Nginx serves the finished website                   |
| `frontend/nginx.conf`           | tells Nginx how to serve my website                   |
| `frontend/package.json`           | ists your project info, scripts, and dependencies                   |
| `frontend/package-lock.json`           | locks the exact package versions                   |
| `frontend/tsconfig.json`           | tells TypeScript how to compile/check your code                   |
| `frontend/tsconfig.tsbuildinfo`           | TypeScript build cache                   |
| `frontend/vite.config.ts`           | tells Vite how to build/run the frontend                   |
| `frontend/node_modules/...`           | all the JavaScript packages my frontend needs are installed                   |
| `frontend/src/App.tsx`      | Pages, five builder steps, saved designs, and cart. main/root page structure               |
| `frontend/src/Bouquet.tsx`  | Interactive SVG flower and bouquet artwork. bouquet builder component                                   |
| `frontend/src/catalog.json` | Sample flower/product names, prices, sizes, and options; shared with the API |
| `frontend/src/main.tsx` | starts the React app |
| `frontend/src/model.test.ts` | tests for model.ts |
| `frontend/src/styles.css`   | Colours, typography, layout, and mobile breakpoints, all styling                         |
| `frontend/src/model.ts`     | Types, local pricing, storage helpers, API client. types/interfaces and helper logic                            |
| `backend/Dockerfile`           | tells docker how to build the backend container for FastAPI                   |
| `backend/main.py`           | brain of backendAPI. connects to MariaDB, defines what valid bouquet/order data looks like, calculates prices, and exposes API endpoints that your frontend can call.  validates / calculates / saves                |
| `backend/requirements.txt`           | contains all the packages that are needed for this project                   |
| `compose.yaml`              | Docker compose file. start different parts/containers of the app together. docker read this file once i hit the command to build docker (docker compose up --build) connects frontend + backend + mariaDB                                                        |
| `.env`              |  contains the passwords. this is inside gitignore and will not be pushed anywhere in the repo                                                         |

## API

| Method | Path                | Purpose                                         |
| ------ | ------------------- | ----------------------------------------------- |
| GET    | `/api/health`       | Verify API/database connection                  |
| GET    | `/api/catalog`      | Read all catalogue choices                      |
| POST   | `/api/quote`        | Calculate a full price on the server        |
| POST   | `/api/designs`      | Persist a design; returns an opaque UUID        |
| GET    | `/api/designs/{id}` | Retrieve a design by its UUID                   |
| POST   | `/api/orders`       | Save an order draft; requires a UUID request ID, formats the order information that gets sent back to the frontend. |
