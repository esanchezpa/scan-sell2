# VentaFacil POS

> Version estable 1.0.2 - POS web e inventario para tienda pequena, con escaneo de codigos de barra, catalogo, ventas, stock e imagenes de productos.

## Estado del proyecto

VentaFacil POS 1.0.2 consolida el retorno al frontend web React y el backend FastAPI como base estable del producto. El frontend activo esta en `src/`; el directorio `frontend/` pertenece a la etapa Flutter anterior y ya no es la app principal.

## Stack

| Capa | Tecnologia |
|------|------------|
| Frontend | React 19, Vite 7, TanStack Router/Start, Zustand, Radix UI, Tailwind CSS |
| Backend | Python, FastAPI async, SQLAlchemy async, Pydantic |
| Base de datos | PostgreSQL 18 con Alembic |
| Cache opcional | Redis |
| Escaneo | Lector HID tipo teclado y camara con ZXing |
| Integracion externa | OpenFoodFacts via backend con cache local |

## Funcionalidades 1.0

- Catalogo de productos con busqueda, imagen, categoria, precio, costo, stock y alerta de bajo stock.
- Creacion, edicion, eliminacion logica y reactivacion de productos.
- Lookup de barcode interno primero, incluyendo productos desactivados.
- Reactivacion de productos inactivos desde escaneo con `PATCH /products/{id}/reactivate`.
- Punto de venta con carrito, cantidades, totales y registro de venta.
- Descuento de inventario y movimientos de stock al completar ventas.
- Historial de ventas.
- Carga de imagenes servidas por backend desde `/images`.
- Settings de accesibilidad y persistencia frontend con Zustand.
- Grafo arquitectonico generado con graphify en `graphify-out/`.

## Estructura

```text
scan-sell2/
|-- backend/                 # FastAPI, SQLAlchemy, Alembic
|   |-- app/main.py          # App FastAPI, CORS, routers, static /images
|   |-- app/routers/         # products, barcode, sales, inventory, settings
|   |-- app/services/        # logica de negocio
|   |-- app/models/          # modelos SQLAlchemy
|   |-- app/schemas/         # schemas Pydantic
|   |-- alembic/             # migraciones
|-- src/                     # frontend React activo
|   |-- routes/              # paginas TanStack Router
|   |-- components/          # dialogos, scanner, layout, UI
|   |-- hooks/               # listener global de barcode
|   |-- lib/api.ts           # cliente HTTP
|   |-- lib/store.ts         # estado global Zustand y mappers
|-- graphify-out/            # grafo de arquitectura generado
|-- docs_init/               # documentos historicos de planificacion
|-- docker-compose.yml       # postgres y redis locales basicos
|-- docker-compose.local.yml # stack completo local: postgres, redis, backend, frontend
|-- docker-compose.neon.yml  # stack app/backend contra base Neon
|-- package.json             # scripts frontend
|-- README.md
```

## Inicio rapido

### Opcion A: Docker con base de datos local

Usa esta opcion si quieres que todo viva en la maquina local: PostgreSQL 18, Redis, backend, frontend, imagenes y logs.

Requisitos:

- Windows 10/11.
- Docker Desktop instalado y abierto.
- Puertos libres: `5173`, `8000`, `5433`, `6379`.

Uso:

```text
start-ventafacil.bat
```

Esto levanta `docker-compose.local.yml`, aplica migraciones, crea datos demo si la base local esta vacia y abre:

```text
http://localhost:5173
```

Para detener la app:

```text
stop-ventafacil.bat
```

Para ver logs:

```text
logs-ventafacil.bat
```

Los datos quedan guardados en volumenes Docker. Detener la app no borra productos, ventas ni stock.

### Opcion B: Docker usando base de datos Neon

Usa esta opcion para una maquina nueva que debe conectarse a la base real en Neon. En este modo Docker no levanta PostgreSQL local; solo levanta Redis, backend y frontend. El seed demo queda desactivado.

Requisitos:

- Docker Desktop instalado y abierto.
- Puertos libres: `5173`, `8000`, `6379`.
- Un archivo `.env` con las URLs de Neon y los IDs del negocio/tienda correctos.

Configura `.env`:

```bash
copy .env.example .env
```

Valores importantes para Neon:

```env
# URL pooled de Neon para la app. Cambia postgresql:// por postgresql+psycopg://
DATABASE_URL=postgresql+psycopg://usuario:password@host-pooler.region.aws.neon.tech/base?sslmode=require&channel_binding=require

# URL directa de Neon para migraciones Alembic. Si no la tienes, dejala vacia.
DIRECT_DATABASE_URL=postgresql+psycopg://usuario:password@host.region.aws.neon.tech/base?sslmode=require&channel_binding=require

SEED_DEMO_DATA=false
VITE_BUSINESS_ID=6
VITE_STORE_ID=6
```

Uso:

```text
start-ventafacil-neon.bat
```

Para detener:

```text
stop-ventafacil-neon.bat
```

Para ver logs:

```text
logs-ventafacil-neon.bat
```

La base de datos permanece en Neon. Los contenedores solo guardan localmente imagenes subidas y logs tecnicos.

Los logs tecnicos persistentes del backend se guardan en `logs/backend-YYYYMMDD-HH.log` y `logs/backend-errors-YYYYMMDD-HH.log`. Se particionan por hora y conservan 14 dias por defecto. Los logs SQL de SQLAlchemy y los access logs HTTP no se guardan en archivos persistentes por defecto para evitar crecimiento excesivo.

La imagen Docker de base de datos esta alineada con PostgreSQL 18 (`postgres:18-alpine`). Si ya existia un volumen Docker creado con PostgreSQL 14, no se debe arrancar directamente con 18 sobre ese mismo volumen; hay que migrar con dump/restore o recrear el volumen si solo contenia datos demo.

Nota tecnica: el contenedor frontend usa el servidor Vite en modo local (`npm run dev -- --host 0.0.0.0`) porque la salida actual de TanStack Start no expone un servidor `preview` standalone compatible con este empaquetado.

### 1. Clonar y configurar

```bash
git clone https://github.com/esanchezpa/scan-sell2.git
cd scan-sell2
cp .env.example .env
```

Edita `.env` con tu `DATABASE_URL`, `REDIS_URL`, CORS e `IMAGES_DIR`.

### 2. Levantar infraestructura local

```bash
docker compose up -d postgres redis
```

Nota: `docker-compose.yml` usa PostgreSQL 18 y lo expone en `127.0.0.1:5433`. Si usas PostgreSQL local en `5432`, ajusta `DATABASE_URL`.

### 3. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

### 4. Frontend

Desde la raiz del repo:

```bash
npm install
npm run dev
```

App local:

```text
http://localhost:5173
```

Build de produccion:

```bash
npm run build
```

## Variables clave

Backend local con PostgreSQL Docker:

```env
DATABASE_URL=postgresql+psycopg://ventafacil_user:123@127.0.0.1:5433/ventafacil_dev
REDIS_URL=redis://127.0.0.1:6379/0
APP_HOST=127.0.0.1
APP_PORT=8000
APP_ENV=development
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:8000
OPENFOODFACTS_BASE_URL=https://world.openfoodfacts.org/api/v2
OPENFOODFACTS_TIMEOUT=5000
IMAGES_DIR=C:\ruta\absoluta\a\scan-sell2\images
SEED_DEMO_DATA=true
VITE_BUSINESS_ID=1
VITE_STORE_ID=1
```

Backend con Neon:

```env
DATABASE_URL=postgresql+psycopg://usuario:password@host-pooler.region.aws.neon.tech/base?sslmode=require&channel_binding=require
DIRECT_DATABASE_URL=postgresql+psycopg://usuario:password@host.region.aws.neon.tech/base?sslmode=require&channel_binding=require
REDIS_URL=redis://127.0.0.1:6379/0
APP_HOST=127.0.0.1
APP_PORT=8000
APP_ENV=neon
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:8000
IMAGES_DIR=C:\ruta\absoluta\a\scan-sell2\images
SEED_DEMO_DATA=false
VITE_BUSINESS_ID=6
VITE_STORE_ID=6
```

Si `VITE_BUSINESS_ID` y `VITE_STORE_ID` no existen, el cliente usa `BUSINESS_ID=6` y `STORE_ID=6`. Para Docker local con seed demo, normalmente son `1` y `1`; para la base compartida en Neon, valida los IDs reales antes de construir el frontend.

## API principal

Base URL local:

```text
http://localhost:8000/api/v1
```

Productos:

- `GET /products?business_id=6`
- `GET /products/{product_id}`
- `POST /products`
- `PATCH /products/{product_id}`
- `DELETE /products/{product_id}`
- `PATCH /products/{product_id}/reactivate`
- `GET /products/barcode/{barcode}?business_id=6`
- `GET /products/barcode-exists/{barcode}?business_id=6`
- `POST /products/upload-image`
- `GET /products/categories/?business_id=6`

Barcode:

- `GET /barcode/lookup/{barcode}?business_id=6&store_id=6`

Ventas:

- `POST /sales`
- `GET /sales/history?business_id=6`

Inventario:

- `GET /inventory/stock/{store_id}`
- `POST /inventory/movement`

Settings:

- `GET /settings/`
- `PUT /settings/`

## Flujo de reactivacion de productos

Cuando se escanea un barcode que pertenece a un producto interno con `is_active=false`:

1. El backend responde desde `/barcode/lookup` con `source="internal"`, `status="inactive"` y `product_id`.
2. El frontend muestra confirmacion de reactivacion.
3. `ProductDialog` abre en modo `reactivate` con todos los datos internos del producto.
4. El submit llama `PATCH /products/{product_id}/reactivate`.
5. El backend actualiza el producto, restaura `is_active=true`, upsertea `stock_balances` y registra `inventory_movements.reference_type="product_reactivation"`.

## Graphify

El grafo de arquitectura de esta version esta en:

- `graphify-out/graph.html`: visualizacion interactiva.
- `graphify-out/graph.json`: grafo estructurado.
- `graphify-out/GRAPH_REPORT.md`: reporte de comunidades, nodos y flujos.
- `graphify-out/manifest.json`: manifest para actualizaciones incrementales.

Resumen actual del grafo:

- 345 nodos
- 456 relaciones
- 17 comunidades
- Flujos destacados: reactivacion de producto, venta/inventario, contrato frontend-backend.

## Verificacion recomendada

```bash
cd backend
.venv\Scripts\python.exe -m compileall app

cd ..
npm run build
git diff --check
```

Para validar reactivacion en Network:

- `GET /api/v1/barcode/lookup/{barcode}?business_id=6&store_id=6`
- `PATCH /api/v1/products/{product_id}/reactivate`
- No debe aparecer `POST /api/v1/products` durante reactivacion.

## Ramas relevantes

- `codex/feat-product-reactivation-flow`: rama actual con reactivacion de productos y documentacion 1.0.
- `ANTIGRAVITY-FEATS-8-react-revert`: base de retorno a React.
- `ANTIGRAVITY-FEATS-7-backend-fixes`: fixes previos de backend.

## Notas de release 1.0.2

Esta version refuerza el flujo POS de venta y catalogo: el stock se descuenta con validacion atomica, los movimientos de inventario quedan firmados/auditables, y `Guardar y agregar` desde una venta agrega el producto creado o reactivado al carrito activo. El stack Docker queda documentado en dos modos: BD local con seed demo y Neon sin seed demo.

## Notas de release 1.0.0

Esta version estabiliza la arquitectura React + FastAPI + PostgreSQL y deja fuera el camino Flutter como app principal. Los siguientes pasos recomendados para 1.1 son endurecer constraints de BD, tests automatizados de flujos criticos, control de stock negativo, autenticacion/roles y endpoints de reportes.
