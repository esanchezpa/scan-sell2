# VentaFácil

> POS e inventario para tienda pequeña — Flutter + FastAPI + PostgreSQL

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Flutter (Riverpod · GoRouter · Dio) |
| Backend | Python 3.12 + FastAPI + SQLAlchemy |
| Base de datos | PostgreSQL |
| Cache (opcional) | Redis |
| Escáner principal | Lector HID físico (teclado) |
| Escáner secundario | Cámara (activable desde Settings) |

## Estructura del monorepo

```
scan-sell2/
├── backend/          # FastAPI + SQLAlchemy + Alembic
├── frontend/         # Flutter app
├── src/              # Prototipo React/TanStack (solo referencia visual)
├── docs_init/        # Blueprints y planes de implementación
├── .env.example      # Variables de entorno requeridas (copiar a .env)
├── docker-compose.yml
└── CHANGES.md        # Historial de cambios por fase
```

## Inicio rápido

### 1. Clonar y configurar entorno

```bash
git clone https://github.com/esanchezpa/scan-sell2.git
cd scan-sell2
cp .env.example .env
# Editar .env con tus valores reales
```

### 2. Levantar infraestructura (opcional, Docker)

```bash
docker compose up -d postgres redis
```

### 3. Backend

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Frontend (Flutter)

```bash
cd frontend
flutter pub get
flutter run
```

## Arquitectura de datos

PostgreSQL es la única fuente oficial de stock, ventas y reportes.
Redis es opcional: cache, rate-limiting y pub/sub. Nunca stock oficial.

## Ramas de desarrollo

Cada fase se desarrolla en una rama `ANTIGRAVITY-FEATS-[nombre]`:

| Rama | Contenido |
|------|-----------|
| `ANTIGRAVITY-FEATS-0-setup` | Estructura base, .gitignore, entornos |
| `ANTIGRAVITY-FEATS-1-db-models` | Modelos SQLAlchemy, Alembic, settings |
| `ANTIGRAVITY-FEATS-2-services` | FastAPI routers y servicios |
| `ANTIGRAVITY-FEATS-3-flutter-base` | Flutter theme, routing, API client |
| `ANTIGRAVITY-FEATS-4-flutter-catalog` | Dashboard, Catálogo, Inventario |
| `ANTIGRAVITY-FEATS-5-flutter-pos` | POS, carrito, HID scanner |
| `ANTIGRAVITY-FEATS-6-final-integration` | Cámara, Settings (modos), seed data |

## Notas

- El archivo `.env` nunca se sube al repositorio.
- Ver `CHANGES.md` para el historial detallado de cambios por fase.
