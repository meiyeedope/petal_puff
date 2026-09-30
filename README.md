## application tools 
React + typescript
FastAPI
MariaDB

## Starts the app through docker with React, FastAPI, MariaDB
docker compose up --build
link : http://localhost:8080
docs: http://localhost:8000/docs

## Stop the app 
docker compose down

## Frontend-only preview. no backend
cd frontend
npm ci
npm run dev
link : http://localhost:5173

## Overview of the files 
| `frontend/src/App.tsx`      | Pages, five builder steps, saved designs, and cart                           |
| `frontend/src/Bouquet.tsx`  | Interactive SVG flower and bouquet artwork                                   |
| `frontend/src/styles.css`   | Colours, typography, layout, and mobile breakpoints                          |
| `frontend/src/catalog.json` | Sample flower/product names, prices, sizes, and options; shared with the API |
| `frontend/src/model.ts`     | Types, local pricing, storage helpers, API client                            |
| `backend/main.py`           | API validation, authoritative pricing, MariaDB persistence                   |
| `compose.yaml`              | Complete local stack                                                         |

## API
| Method | Path                | Purpose                                         |
| ------ | ------------------- | ----------------------------------------------- |
| GET    | `/api/health`       | Verify API/database connection                  |
| GET    | `/api/catalog`      | Read all catalogue choices                      |
| POST   | `/api/quote`        | Recalculate a design price on the server        |
| POST   | `/api/designs`      | Persist a design; returns an opaque UUID        |
| GET    | `/api/designs/{id}` | Retrieve a design by its UUID                   |
| POST   | `/api/orders`       | Save an order draft; requires a UUID request ID |

