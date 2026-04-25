# CHANGES.md — Historial de Cambios VentaFácil

> Este archivo es **append-only**. Cada fase agrega su bloque al final.
> Formato: `## [Fase] — YYYY-MM-DD HH:MM TZ`

---

## Fase 0: Setup del Repositorio y Entorno Base — 2026-04-25 05:46 UTC-7

### Resumen
Consolidación inicial del monorepo. Se creó el repositorio remoto en GitHub, se configuró el entorno de desarrollo, la estructura de carpetas definitiva y los archivos de infraestructura.

### Cambios Realizados

- **GitHub:** Creado repositorio privado `scan-sell2` en `https://github.com/esanchezpa/scan-sell2`.
- **Git:** Repositorio local inicializado con `git init` y remote `origin` configurado.
- **`.gitignore`:** Añadido con cobertura para Python, Flutter/Dart, Node.js, variables de entorno, IDE y OS.
- **`.env.example`:** Plantilla de variables de entorno creada con: `DATABASE_URL`, `REDIS_URL`, `APP_HOST`, `APP_PORT`, `CORS_ORIGINS`, `JWT_SECRET_KEY`, `OPENFOODFACTS_BASE_URL`.
- **`README.md`:** Documentación principal del proyecto con stack, estructura de monorepo, instrucciones de inicio y tabla de ramas.
- **`docker-compose.yml`:** Definición de servicios `postgres` (v16-alpine) y `redis` (v7-alpine) con volúmenes persistentes.
- **`backend/`:** Estructura de carpetas FastAPI creada:
  - `app/main.py`, `app/config.py`, `app/database.py`
  - `app/routers/`, `app/services/`, `app/models/`, `app/schemas/`, `app/utils/`
  - `alembic/`, `tests/`
  - `requirements.txt`, `alembic.ini`
- **`frontend/`:** Proyecto Flutter creado con `flutter create .`.
- **`CHANGES.md`:** Este archivo, creado en la Fase 0.

### Rama
`ANTIGRAVITY-FEATS-0-setup`

### Archivos de Apoyo
- `docs_init/CLAUDE.md`
- `docs_init/IMPLEMENTATION_PLAN_POSTGRESQL.md` (Fase 0)

---
