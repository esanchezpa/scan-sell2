# Project Overview

This repository is **NeoVentaFacil / scan-sell**, the working repository for **VentaFacil**, a POS and inventory management system for a small bazaar-style store.

- Backend: **Python + FastAPI**
- Frontend target: **Flutter**
- Current prototype: **React + TanStack Router + Vite + Zustand** in `src/`
- Database: **PostgreSQL** as the official source of truth
- Redis: optional backend support for cache, rate limiting, pub/sub, short-lived locks, and precomputed reports; Redis is never the official stock source
- Database tooling: agents may use **mcp-toolbox-for-databases** to inspect the existing PostgreSQL database, verify schemas, run read-only checks, and validate migrations/plans
- Primary device: **touchscreen laptop** used at the counter
- Primary barcode input: **physical HID barcode scanner** that behaves like a keyboard and usually sends Enter after scanning
- Secondary barcode input: **camera scanner**, enabled only from settings
- Purpose: manage product catalog, barcode lookup, stock, POS sales, payments, inventory movements, profitability, and dashboard reports for a small local store.

## High-Level Workflow

1. Business, store, user, and local device setup
2. Product catalog and product barcode management
3. Stock balance control by store
4. POS sale from a touchscreen laptop using the physical barcode scanner
5. Payment registration and inventory movement creation
6. Dashboard, profitability, low-stock alerts, and sales reports
7. Optional camera-based barcode scanning when enabled from settings
8. Optional OpenFoodFacts lookup for unknown barcodes

## Repo Structure

### Current State

The repository currently contains a React/TanStack prototype:

- `src/router.tsx` -> TanStack Router setup
- `src/routes/` -> prototype routes such as dashboard, sales, catalog, inventory, settings
- `src/components/` -> prototype UI components, dialogs, scanner, and layout
- `src/lib/store.ts` -> Zustand local state with seed data and localStorage persistence
- `docs_init/` -> architecture blueprints and implementation references
- `CLAUDE.txt` -> legacy empty file; use `CLAUDE.md` as the active agent guide

Treat the current React app as a **visual and behavioral prototype**, not the final architecture. Preserve useful UX decisions, but move source-of-truth business logic to FastAPI + PostgreSQL.

### Target Root

- `.env.example` -> required environment variables for backend, database, Redis, and external services
- `docker-compose.yml` -> local PostgreSQL and Redis services if needed by development
- `README.md` -> human setup guide
- `docs_init/` -> source blueprints and implementation plans
- `backend/` -> FastAPI application
- `frontend/` -> Flutter application

### Backend

Located in `backend/`.

- `app/main.py` -> FastAPI entrypoint, CORS setup, router registration, healthcheck
- `app/config.py` -> environment and runtime settings
- `app/database.py` -> SQLAlchemy engine/session setup for PostgreSQL
- `app/routers/` -> API routes; keep these thin
  - `health.py`
  - `products.py`
  - `inventory.py`
  - `sales.py`
  - `reports.py`
  - `barcode.py`
  - `settings.py`
  - `auth.py` if authentication is added
- `app/services/` -> business logic and transactions
  - `products_service.py`
  - `inventory_service.py`
  - `sales_service.py`
  - `reports_service.py`
  - `barcode_service.py`
  - `settings_service.py`
  - `redis_cache_service.py` if Redis is used
- `app/models/` -> SQLAlchemy models mapped to PostgreSQL tables
- `app/schemas/` -> Pydantic request/response schemas
- `app/utils/` -> shared helpers, logging, error mapping, money/date utilities
- `alembic/` -> migrations
- `tests/` -> backend unit and integration tests

### Frontend

Located in `frontend/`.

- `lib/main.dart` -> Flutter app bootstrap and theme setup
- `lib/core/` -> shared config, constants, error handling, API base client
- `lib/routes/` -> app routing
- `lib/features/` -> feature-first screens and logic
  - `dashboard/`
  - `sales/`
  - `catalog/`
  - `inventory/`
  - `reports/`
  - `settings/`
  - `barcode/`
- `lib/shared/` -> reusable widgets, dialogs, formatters, validators
- `lib/api/` -> typed HTTP clients using Dio
- `lib/providers/` -> Riverpod providers and app state
- `lib/models/` -> Dart DTOs/entities aligned with Pydantic schemas
- `lib/local_cache/` -> optional local UX cache; never official stock source

### Docs

Located in `docs_init/`.

- `SYSTEM_BLUEPRINT.md` -> high-level VentaFacil business and system flow
- `FRONTEND_BLUEPRINT.md` -> UI/UX behavior and design system
- `BACKEND_LOGIC.md` -> backend transaction and service responsibilities
- `LOGICA_BD_RELACIONAL.md` -> PostgreSQL relational model and critical SQL logic
- `IMPLEMENTATION_PLAN_POSTGRESQL.md` -> detailed implementation plan for the agent

## Backend Navigation Map

When working on backend features, follow this order:

1. Start from `backend/app/routers/*.py` to understand the public API contract.
2. Trace into `backend/app/services/*.py` for business logic.
3. Check `backend/app/models/*` and `backend/app/schemas/*` if data structures are involved.
4. Check `backend/app/database.py` for DB session behavior and transaction boundaries.
5. Check `backend/app/config.py` for env/config behavior.
6. Check `backend/app/utils/*` for shared helper behavior.
7. If database truth is unclear, use `mcp-toolbox-for-databases` to inspect PostgreSQL metadata before guessing.

### Backend Main Flows

- Sales flow: `routers/sales.py` -> `services/sales_service.py` -> PostgreSQL transaction over `sales`, `sale_items`, `sale_payments`, `stock_balances`, and `inventory_movements`
- Product flow: `routers/products.py` -> `services/products_service.py` -> `products`, `product_barcodes`, `categories`, `stock_balances`
- Inventory flow: `routers/inventory.py` -> `services/inventory_service.py` -> `stock_balances` and `inventory_movements`
- Barcode flow: physical HID scanner or camera -> Flutter barcode handler -> `GET /products/barcode/{barcode}` -> `product_barcodes` lookup -> product/cart flow
- External barcode flow: `routers/barcode.py` -> `services/barcode_service.py` -> OpenFoodFacts -> optional Redis cache
- Reports flow: `routers/reports.py` -> `services/reports_service.py` -> historical `sale_items` calculations
- Settings flow: `routers/settings.py` -> `services/settings_service.py` -> `settings` table; controls camera scanner availability and local device options

## Database Navigation Map

PostgreSQL already exists for this project. Before creating migrations or changing models, inspect the real database state.

Recommended inspection order:

1. Use `mcp-toolbox-for-databases` to list schemas and tables.
2. Inspect tables relevant to the task only.
3. Compare existing columns, indexes, constraints, and foreign keys with `docs_init/LOGICA_BD_RELACIONAL.md`.
4. For sales or inventory work, inspect `stock_balances`, `sales`, `sale_items`, `sale_payments`, and `inventory_movements` together.
5. For barcode work, inspect `products` and `product_barcodes` together.
6. Do not assume a table is missing until the database tool confirms it.
7. Do not run destructive SQL through database tools unless the user explicitly asks.

Core tables:

- `businesses`
- `users`
- `stores`
- `categories`
- `products`
- `product_barcodes`
- `stock_balances`
- `sales`
- `sale_items`
- `sale_payments`
- `inventory_movements`
- `settings`

## Frontend Navigation Map

When working on Flutter UI features, follow this order:

1. Start from `frontend/lib/routes/` to identify the screen entry.
2. Open the relevant feature in `frontend/lib/features/<feature>/`.
3. Trace providers/controllers in the same feature.
4. Check reusable UI in `frontend/lib/shared/`.
5. Check API calls in `frontend/lib/api/`.
6. Validate DTOs in `frontend/lib/models/` against backend Pydantic schemas.

When using the current React prototype as reference:

1. Start from `src/routes/*.tsx`.
2. Trace dialogs/components in `src/components/`.
3. Check `src/lib/store.ts` only to understand current data shape and UX behavior.
4. Do not preserve localStorage/Zustand as source of truth in the final app.

### Frontend Route Hints

Target Flutter navigation should preserve these user-facing areas:

- `/` -> Dashboard / Inicio
- `/sales` -> POS and sales history
- `/catalog` -> Product catalog
- `/inventory` -> Stock and low-stock alerts
- `/reports` -> Sales and profitability reports
- `/settings` -> Backend connection, camera scanner toggle, store/device settings
- `/more` -> Secondary modules such as customers, suppliers, invoices, purchases if kept

## Primary UX Notes

The main production device is a touchscreen laptop at the store counter.

Prioritize:

- Large touch targets for sale actions, quantity buttons, and checkout.
- Keyboard-focus stability for the physical barcode scanner.
- Fast scan-to-cart behavior with minimal dialogs.
- A POS layout that works well on a laptop screen before optimizing for phone.
- Clear visual feedback after each scan: product added, stock insufficient, or unknown barcode.
- Camera scanner as secondary, hidden unless enabled in settings.

Physical barcode scanner behavior:

- Treat the scanner as HID keyboard input.
- Keep a hidden or dedicated barcode input focused on the POS screen.
- Buffer characters until Enter.
- On Enter, normalize the barcode and call product lookup.
- Avoid opening the camera automatically.
- Never require a mouse click between scans during normal checkout.

## Working Rules

- PostgreSQL is the official source of truth.
- `stock_balances` is the official stock source.
- Redis is optional and must never be used as official stock or sales storage.
- Sales must be atomic database transactions.
- `sale_items` must store historical product name, barcode, price, and cost.
- Do not calculate profitability from current `products.price` or `products.cost`.
- Do not physically delete completed sales during normal operation; use `cancelled`, `refunded`, or `partially_refunded` status.
- Every stock-changing operation must write an `inventory_movements` row.
- API handlers must stay thin; business logic belongs in `app/services/`.
- Validate request/response data with Pydantic schemas.
- Use `NUMERIC(12,2)` or Decimal-compatible types for money.
- All multi-tenant queries must filter by `business_id`.
- Barcode lookup must use `product_barcodes`, not only `products`.
- The camera barcode scanner is available only when the relevant setting is enabled.
- The physical barcode scanner is the default operational path.
- Use `mcp-toolbox-for-databases` for read-only DB discovery when schema details matter.
- Prefer surgical edits over broad rewrites.

## Debugging Strategy

### Backend

1. Identify the endpoint in `backend/app/routers/`.
2. Trace the called service in `backend/app/services/`.
3. Check Pydantic schemas for validation mismatches.
4. Inspect SQLAlchemy models and actual PostgreSQL tables.
5. Use `mcp-toolbox-for-databases` for read-only schema/data verification.
6. Confirm transaction boundaries for sales and stock changes.
7. Inspect logs and error mapping.

### Database

1. Confirm the active `DATABASE_URL`.
2. Inspect the existing PostgreSQL schema before generating migrations.
3. Verify indexes for barcode lookup, sales by date, and stock by store/product.
4. For sales bugs, compare `sales`, `sale_items`, `sale_payments`, `stock_balances`, and `inventory_movements` in one pass.
5. For report bugs, verify calculations use `sale_items.price_at_sale` and `sale_items.cost_at_sale`.

### Frontend

1. Identify the screen/feature.
2. Trace providers/controllers.
3. Inspect API client calls and DTO parsing.
4. Validate UI state against backend response shape.
5. For scanner bugs, test physical HID input before camera input.
6. Confirm the camera scanner toggle in settings before showing camera UI.

## Commands

From backend directory:

- Start backend: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- Run migrations: `alembic upgrade head`
- Create migration: `alembic revision --autogenerate -m "message"`
- Run backend tests: `pytest`

From Flutter frontend directory:

- Install dependencies: `flutter pub get`
- Start app: `flutter run`
- Analyze: `flutter analyze`
- Run tests: `flutter test`

From repo root when infra files exist:

- Start PostgreSQL and Redis: `docker compose up -d postgres redis`
- Stop infra: `docker compose down`

Current React prototype commands:

- Install: `npm install`
- Start prototype: `npm run dev`
- Build prototype: `npm run build`

## Environment Notes

Required env values include:

- `DATABASE_URL` -> PostgreSQL connection string
- `REDIS_URL` -> optional Redis connection string
- `JWT_SECRET_KEY` -> API auth secret if JWT is enabled
- `OPENFOODFACTS_BASE_URL` -> usually `https://world.openfoodfacts.org/api/v2`
- `APP_HOST=0.0.0.0`
- `APP_PORT=8000`
- `CORS_ORIGINS` -> Flutter/web/dev origins allowed during local development

For a local touchscreen laptop deployment:

- Backend should listen on `0.0.0.0`.
- The laptop should have a stable local IP if other devices connect.
- The Flutter app running on the same laptop can use `localhost` or `127.0.0.1`.
- Mobile devices on the same Wi-Fi must use the laptop local IP.

## Token-Saving Rules for Claude

- Read only the files directly relevant to the task.
- Do not scan the whole repository unless necessary.
- For backend tasks, start in `backend/app/routers/` and then jump only to referenced services.
- For frontend tasks, start in the route or feature folder, then inspect only directly imported modules.
- For database tasks, inspect only the involved tables with `mcp-toolbox-for-databases`.
- Summarize findings briefly before proposing broad refactors.
- Prefer surgical edits over repo-wide rewrites.

###################################################################################################

# VentaFacil Context

Monorepo target:

- backend = Python/FastAPI (`backend/app`)
- frontend = Flutter (`frontend/lib`)
- database = PostgreSQL
- optional cache = Redis
- current prototype = React/TanStack/Vite (`src`)

Backend flow:

- `app/routers/*.py` -> API entrypoints
- `app/services/*.py` -> business logic and transactions
- `app/models/*` -> SQLAlchemy data structures
- `app/schemas/*` -> Pydantic contracts
- `app/config.py` -> config/env
- `app/database.py` -> PostgreSQL session handling
- `app/utils/*` -> helpers

Frontend flow:

- `routes/` -> screen entry
- `features/*` -> page logic by domain
- `providers/*` -> shared state with Riverpod
- `api/*` -> backend calls with Dio
- `models/*` -> DTOs/entities
- `shared/*` -> reusable widgets

Main backend domains:

- products/catalog
- product_barcodes
- inventory/stock_balances
- sales/sale_items/sale_payments
- inventory_movements
- reports/profitability
- settings/scanner configuration
- barcode/OpenFoodFacts lookup

Rules:

- Do not assume Java/Spring patterns.
- Do not make Redis the source of truth.
- Keep route handlers thin.
- Put logic in services.
- Use PostgreSQL transactions for sales.
- Inspect the existing PostgreSQL database before changing schema.
- Use `mcp-toolbox-for-databases` for DB discovery when available.
- Reuse existing docs in `docs_init/` first.
- Read only relevant files, not the whole repo.
