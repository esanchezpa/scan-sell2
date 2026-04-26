# VentaFacil POS - Guia de desarrollo para agentes

## Snapshot actual

VentaFacil / scan-sell2 es un POS de tienda pequena con backend FastAPI y frontend React.

- Backend: Python, FastAPI async, SQLAlchemy async, Alembic, PostgreSQL.
- Frontend real: React 19, Vite 7, TanStack Router, Zustand, Radix UI, Tailwind CSS.
- Base de datos: PostgreSQL 18; Redis existe en docker-compose pero no es fuente de verdad.
- App principal: catalogo, ventas, inventario, escaneo de codigos de barra, imagenes y settings.
- Importante: `src/` es el frontend activo. `frontend/` esta vacio/legado. El README actual aun habla de Flutter y esta desactualizado.

## Mapa del repo

Raiz:

- `package.json`: scripts reales del frontend (`dev`, `build`, `lint`, `format`).
- `vite.config.ts`, `tsconfig.json`, `components.json`: toolchain del frontend React.
- `docker-compose.yml`: PostgreSQL 18 en host `5433` y Redis en `6379`.
- `docker-compose.local.yml`: stack completo local con Postgres, Redis, backend y frontend; usa seed demo.
- `docker-compose.neon.yml`: stack para usar Neon como base remota; no levanta Postgres local y desactiva seed demo.
- `start-ventafacil-sin-docker.bat`: modo Windows sin Docker; crea/usa `backend\.venv`, aplica Alembic, inicia backend y frontend contra PostgreSQL local o Neon segun `.env`.
- `.env` / `.env.example`: configuracion backend y rutas de imagenes.
- `logs/`: logs tecnicos persistentes del backend particionados por hora; los archivos runtime se ignoran en Git.
- `backend/`: API FastAPI, modelos, schemas, servicios y migraciones.
- `src/`: frontend React/TanStack activo.
- `images/`: archivos servidos por backend en `/images`.
- `docs_init/`: documentos de fase/planificacion.
- `dist/`: build output, no usar como fuente.

Backend:

- `backend/app/main.py`: crea FastAPI, CORS, monta `/images`, registra routers bajo `/api/v1`.
- `backend/app/config.py`: settings con `DATABASE_URL`, Redis, CORS, OpenFoodFacts e `IMAGES_DIR`.
- `backend/app/database.py`: engine y session async.
- `backend/app/models/`: `core.py`, `product.py`, `inventory.py`, `sales.py`, `barcode.py`.
- `backend/app/schemas/`: contratos Pydantic.
- `backend/app/routers/`: endpoints HTTP.
- `backend/app/services/`: logica de negocio.
- `backend/alembic/versions/`: migracion inicial.

Frontend:

- `src/routes/__root.tsx`: layout raiz, inicializacion de store, listener global de barcode y portal de `ProductDialog`.
- `src/routes/catalog.tsx`, `sales.tsx`, `inventory.tsx`, `settings.tsx`, etc.: pantallas.
- `src/components/ProductDialog.tsx`: crear, editar y reactivar producto.
- `src/components/NewSaleDialog.tsx`: flujo POS/carrito/escaneo en venta.
- `src/components/BarcodeScanner.tsx`: escaner por camara.
- `src/hooks/useGlobalBarcode.ts`: listener para lector HID tipo teclado.
- `src/lib/api.ts`: cliente HTTP centralizado.
- `src/lib/store.ts`: Zustand persistido, mappers backend/frontend y acciones principales.

## Comandos reales

Desde la raiz:

```bash
npm install
npm run dev
npm run build
npm run lint
```

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Infraestructura local:

```bash
docker compose up -d postgres redis
```

Ojo con puertos: `docker-compose.yml` expone PostgreSQL 18 como `127.0.0.1:5433`, pero entornos locales pueden tener `.env` apuntando a `5432`. Si existe un volumen Docker antiguo creado con PostgreSQL 14, migrar con dump/restore o recrearlo si solo tenia datos demo.

Para despliegue local contra Neon usar `docker-compose.neon.yml`, `SEED_DEMO_DATA=false`, `DATABASE_URL` con host pooled y `DIRECT_DATABASE_URL` con host directo para Alembic. Las URLs Neon deben usar prefijo `postgresql+psycopg://` en este backend.

## Variables importantes

Backend:

- `DATABASE_URL`
- `DB_ECHO`
- `REDIS_URL`
- `APP_HOST`, `APP_PORT`, `APP_ENV`
- `CORS_ORIGINS`
- `OPENFOODFACTS_BASE_URL`, `OPENFOODFACTS_TIMEOUT`
- `IMAGES_DIR`
- `LOG_DIR`, `LOG_LEVEL`, `LOG_RETENTION_DAYS`, `LOG_HTTP_ACCESS`

Frontend:

- `VITE_BUSINESS_ID`
- `VITE_STORE_ID`

Si no existen, `src/lib/api.ts` usa defaults `BUSINESS_ID=6` y `STORE_ID=6`. Algunos prompts/manuales antiguos usan `store_id=1`; validar siempre contra la BD real.

## Endpoints principales

Todos bajo `/api/v1` salvo `/health` e imagenes.

Productos:

- `GET /products?business_id=...`
- `GET /products/{product_id}`
- `GET /products/barcode/{barcode}?business_id=...`
- `GET /products/barcode-exists/{barcode}?business_id=...`
- `POST /products`
- `PATCH /products/{product_id}`
- `DELETE /products/{product_id}` soft delete con `is_active=false`
- `POST /products/{product_id}/reactivate` reactivacion simple/legacy
- `PATCH /products/{product_id}/reactivate` reactivacion con payload completo
- `POST /products/upload-image`
- `GET /products/categories/?business_id=...`

Barcode:

- `GET /barcode/lookup/{barcode}?business_id=...&store_id=...`

Inventario:

- `GET /inventory/stock/{store_id}`
- `POST /inventory/movement`

Ventas:

- `POST /sales`
- `GET /sales/history?business_id=...`

Settings:

- `GET /settings/`
- `PUT /settings/`

Reportes:

- `backend/app/routers/reports.py` es placeholder y no esta registrado en `main.py`.

## Flujos de negocio

### Lookup de barcode

`BarcodeService.lookup()` debe mantener este orden:

1. Buscar interno en `product_barcodes` + `products` para el `business_id`, sin filtrar `products.is_active=true`.
2. Si existe producto interno, devolver `source="internal"` y `status="active"` o `"inactive"`.
3. Incluir datos internos: `product_id`, `name`, `description`, `barcode`, `image_url`, `category_id`, `category_name`, `price`, `cost`, `stock_quantity`, `low_stock_threshold`.
4. Solo si no existe barcode interno, consultar `external_product_cache`.
5. Solo si no hay cache vigente, consultar OpenFoodFacts y guardar cache.

No usar cache externa para reactivar productos internos inactivos.

### Reactivacion de productos

Caso esperado:

1. Escaneo encuentra `source="internal"` y `status="inactive"`.
2. Frontend muestra confirmacion.
3. Al aceptar, abre `ProductDialog` en modo `reactivate`.
4. El modal se inicializa con datos internos, no solo barcode.
5. Titulo y boton principal dicen `Reactivar producto`.
6. Submit llama `PATCH /products/{product_id}/reactivate`.
7. Backend valida negocio y tienda, actualiza campos editables, pone `is_active=true`, upsertea `stock_balances` y crea `inventory_movements.reference_type="product_reactivation"`.

Mapeo clave snake_case a camelCase:

- `product_id` -> `id` y `product_id`
- `image_url` -> `imageUrl` y `image_url`
- `category_id` -> `categoryId`
- `category_name` -> `category`
- `stock_quantity` -> `stock`
- `low_stock_threshold` -> `lowStockThreshold` / `lowStockAlert`

### Creacion y edicion de producto

- `ProductDialog` usa `mode`: `create`, `edit`, `reactivate`.
- En create puede ejecutar `api.barcode.lookup()` para sugerir datos externos.
- En reactivate no debe sobrescribir campos con cache externa.
- `POST /products` protege duplicados activos e inactivos; si hay inactivo responde conflicto `PRODUCT_INACTIVE_EXISTS:{id}`.

### Ventas e inventario

- `SalesService.create_sale()` crea `Sale`, `SaleItem`, pagos y movimientos.
- Al vender, decrementa `stock_balances`; si no existe balance, puede crear stock negativo.
- Registra `InventoryMovement` con `movement_type="sale"` y `reference_type="sale"`.
- Ajustes manuales usan `InventoryService.register_movement()`.

## Reglas de trabajo para agentes

- No aplicar instrucciones de otros repos como MiroFish; este repo no es Flask/Vue.
- No trabajar en `frontend/` salvo que el usuario pida revivir el frontend legado.
- Para backend, navegar: router -> service -> model/schema -> config/migration.
- Para frontend, navegar: route -> component -> store/api -> hook.
- Mantener handlers FastAPI delgados; la logica va en `app/services/`.
- Mantener mappers explicitos entre snake_case backend y camelCase frontend.
- No hardcodear mas business/store IDs; usar `BUSINESS_ID`, `STORE_ID` o variables Vite.
- No commitear `.kilo/`, `images/` ni builds generados sin instruccion explicita.
- Si cambian rutas TanStack, validar `routeTree.gen.ts` con build.
- Si cambian endpoints, revisar `src/lib/api.ts` y pantallas que lo consumen.

## Desalineaciones y deuda tecnica conocida

- README esta obsoleto: presenta Flutter como frontend principal aunque el frontend activo es React en `src/`.
- `src/lib/api.ts` aun contiene `inventory.getStatus()`, `inventory.getHistory()` y `reports.getDashboard()`, pero esos endpoints no existen/ no estan registrados.
- `reports.py` es placeholder y no se incluye en `app/main.py`.
- `health.py` existe, pero `main.py` define `/health` directamente y no registra ese router.
- `products.py` declara `/products/{product_id}` antes de `/products/categories/`; esto puede provocar 422 si FastAPI resuelve `categories` como `product_id`.
- CORS define una lista `origins` pero aplica `allow_origins=["*"]`.
- `BarcodeService._lookup_openfoodfacts()` usa URL y timeout hardcodeados en vez de `settings`.
- La migracion inicial no refleja claramente constraints/unicos/FKs que el dominio necesita, por ejemplo barcode unico por negocio y stock unico por tienda/producto.
- Ventas permite stock negativo si no hay balance o si se vende mas de lo disponible.
- La pagina Settings tiene acciones de limpieza local que no limpian la BD; el texto debe evitar prometer borrado total.
- Hay textos con mojibake/encoding roto (`VentaFÃ¡cil`, `CatÃ¡logo`) en varios archivos.
- Falta suite de tests backend/frontend para flujos criticos: lookup interno, reactivacion, venta, stock e imagenes.

## Checks recomendados antes de cerrar cambios

```bash
cd backend
.venv\Scripts\python.exe -m compileall app

cd ..
npm run build
npm run lint
git diff --check
```

Para bugs de escaneo/reactivacion, verificar tambien en Network:

- `GET /api/v1/barcode/lookup/{barcode}?business_id=6&store_id=...`
- `PATCH /api/v1/products/{product_id}/reactivate`
- Ausencia de `POST /api/v1/products` durante reactivacion.
