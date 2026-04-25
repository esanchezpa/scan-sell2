# CHANGES.md â€” Historial de Cambios VentaFÃ¡cil

> Este archivo es **append-only**. Cada fase agrega su bloque al final.
> Formato: `## [Fase] â€” YYYY-MM-DD HH:MM TZ`

---

## Fase 0: Setup del Repositorio y Entorno Base â€” 2026-04-25 05:46 UTC-7

### Resumen
ConsolidaciÃ³n inicial del monorepo. Se creÃ³ el repositorio remoto en GitHub, se configurÃ³ el entorno de desarrollo, la estructura de carpetas definitiva y los archivos de infraestructura.

### Cambios Realizados

- **GitHub:** Creado repositorio privado `scan-sell2` en `https://github.com/esanchezpa/scan-sell2`.
- **Git:** Repositorio local inicializado con `git init` y remote `origin` configurado.
- **`.gitignore`:** AÃ±adido con cobertura para Python, Flutter/Dart, Node.js, variables de entorno, IDE y OS.
- **`.env.example`:** Plantilla de variables de entorno creada con: `DATABASE_URL`, `REDIS_URL`, `APP_HOST`, `APP_PORT`, `CORS_ORIGINS`, `JWT_SECRET_KEY`, `OPENFOODFACTS_BASE_URL`.
- **`README.md`:** DocumentaciÃ³n principal del proyecto con stack, estructura de monorepo, instrucciones de inicio y tabla de ramas.
- **`docker-compose.yml`:** DefiniciÃ³n de servicios `postgres` (v16-alpine) y `redis` (v7-alpine) con volÃºmenes persistentes.
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

## Fase 1: Modelos de Base de Datos — 2026-04-25 05:56 UTC-7

### Resumen
Se crearon los modelos SQLAlchemy reflejando la estructura actual de PostgreSQL y se agregó una nueva tabla para las configuraciones de la aplicación.

### Cambios Realizados
- **Dependencias:** Instalados FastAPI, SQLAlchemy, Alembic, psycopg, pydantic-settings, greenlet.
- **Base de Datos:** Configurado async engine en `app/database.py` y lectura de entorno en `app/config.py`.
- **Modelos:** Mapeados los esquemas de: `Business`, `Store`, `Category`, `Product`, `ProductBarcode`, `StockBalance`, `InventoryMovement`, `Sale`, `SaleItem`, `SalePayment`, `User`.
- **Nueva Tabla:** Agregado el modelo `AppSetting` para soportar configuraciones dinámicas (ej: display mode).
- **Alembic:** Inicializado entorno asíncrono y generada migración para la creación de `app_settings`.

### Rama
`ANTIGRAVITY-FEATS-1-db-models`

---

## Fase 2: Servicios y Endpoints (Backend) — 2026-04-25 05:58 UTC-7

### Resumen
Implementación de la capa de servicios (lógica de negocio) y los enrutadores (endpoints de la API) para las entidades principales en FastAPI.

### Cambios Realizados
- **Schemas (Pydantic):** Creados validadores para `products`, `inventory`, `sales`, `settings`.
- **Servicios:**
  - `products.py`: Gestión de productos y consulta por código de barras.
  - `inventory.py`: Consulta de stock y registro de movimientos de inventario.
  - `sales.py`: Lógica transaccional atómica para crear ventas (guarda Sale, SaleItem, SalePayment y deduce el inventario).
  - `settings.py`: Gestión de configuraciones globales del negocio (útil para el display mode).
- **Routers:** Implementados endpoints en `/api/v1/` para cada módulo e integrados en `main.py`.

### Rama
`ANTIGRAVITY-FEATS-2-services`

---

## Fase 3: Flutter Base — 2026-04-25 06:01 UTC-7

### Resumen
Se inicializó el cliente de Flutter con Riverpod, GoRouter, Dio y Google Fonts para proveer una base escalable y mantener el estilo visual del prototipo original.

### Cambios Realizados
- **Dependencias:** Instalados \lutter_riverpod\, \iverpod_annotation\, \go_router\, \dio\, \google_fonts\ y \uild_runner\.
- **Theme:** Configurado \AppTheme.lightTheme\ (tonos azules, fondo blanco) preservando la identidad de VentaFácil.
- **Router:** Establecida base de navegación con GoRouter (Dashboard, Catalog, Inventory, POS, Settings).
- **API Client:** Cliente Dio configurado para apuntar a \http://localhost:8000/api/v1\.
- **Build Runner:** Archivos generados correctamente.

### Rama
\ANTIGRAVITY-FEATS-3-flutter-base\`n
---

## Fase 4: Pantallas Flutter (Dashboard, Catálogo, Inventario) — 2026-04-25 06:02 UTC-7

### Resumen
Se crearon las interfaces gráficas iniciales para el Dashboard, Catálogo de Productos y control de Inventario, aplicando el diseño UI/UX acordado (esquema azul/blanco, componentes limpios).

### Cambios Realizados
- **Widgets:** Creado \AppDrawer\ compartido para la navegación principal.
- **Pantallas:**
  - \DashboardScreen\: Tarjetas de estadísticas de ventas y lista de transacciones recientes.
  - \CatalogScreen\: Buscador integrado, lista de productos con botón de acción para escaneo.
  - \InventoryScreen\: Tabla de datos desplazable para visualización de stock, umbrales y estado de inventario.
- **Routing:** Actualizado \pp_router.dart\ para enlazar las pantallas reales.

### Rama
\ANTIGRAVITY-FEATS-4-screens\`n
---

## Fase 5: Pantalla POS y Escáner HID — 2026-04-25 06:04 UTC-7

### Resumen
Se diseñó la interfaz central del sistema de ventas (POS) con un diseño responsivo para tablet y web, e integración con lectores de código de barras mediante un \BarcodeListener\ (emulación de teclado HID).

### Cambios Realizados
- **Lógica de Escaneo:** Implementado el componente \BarcodeListener\ que intercepta pulsaciones de teclado rápidas y las procesa como lecturas de código de barras.
- **Pantalla POS:** Creado \POSScreen\ con lista de compras (carrito), panel de acciones rápidas (búsqueda, descuento, cliente) y resumen de cobro.
- **Diseño Responsivo:** Dividido el layout usando \Row\ y \Expanded\ en tablets/escritorio, y columnas simples en dispositivos móviles.
- **Rutas:** Configurado el acceso a la pantalla desde GoRouter.

### Rama
\ANTIGRAVITY-FEATS-5-pos\`n
---

## Fase 6: Configuración, Cámara y Seed Data — 2026-04-25 06:05 UTC-7

### Resumen
Se finalizó la base de la aplicación implementando las configuraciones del sistema, integraciones con cámara y OpenFoodFacts, así como un script de Seed Data para pruebas rápidas.

### Cambios Realizados
- **Configuración:** Implementada \SettingsScreen\ para cambiar entre modo Automático, Móvil y Tablet.
- **Escáner de Cámara:** Agregada dependencia \mobile_scanner\ y creada \CameraScannerScreen\ para leer códigos vía hardware.
- **API Externa:** Creado \OpenFoodFactsService\ para buscar productos globales mediante su código de barras.
- **Base de Datos:** Creado \ackend/scripts/seed_data.py\ que inserta un negocio, sucursal, categorías y productos de prueba en PostgreSQL.

### Rama
\ANTIGRAVITY-FEATS-6-final\`n
---

## Fase 7: Correcciones de Base de Datos y Backend - 2026-04-25 06:15 UTC-7

### Resumen
Se resolvieron problemas de privilegios de esquema en PostgreSQL 15+, asegurando la correcta conexión del backend con la base de datos a través de Docker y corrigiendo dependencias de configuración en FastAPI.

### Cambios Realizados
- **Base de Datos:** Se cambió la versión de PostgreSQL a `14-alpine` en `docker-compose.yml` para evitar restricciones estrictas del esquema `public` introducidas en versiones superiores.
- **Conexión DB:** Se configuró `.env` para usar `127.0.0.1` en lugar de `localhost` para evitar ruteo a IPv6 (WSL) y asegurar conexión directa al contenedor Docker. También se corrigió el driver asíncrono para Alembic.
- **Migraciones:** Se recreó la migración inicial (`62ea25842e8a_initial_migration.py`) después de limpiar el estado anterior. `alembic upgrade head` aplicado con éxito.
- **FastAPI:** Se corrigió un error de sintaxis en `backend/app/main.py` ajustando `settings.CORS_ORIGINS` y `settings.APP_ENV` a notación snake_case (`settings.cors_origins` y `settings.app_env`) requerida por Pydantic V2.
- **Semilla (Seed Data):** Se ejecutó con éxito el script `seed_data.py`, poblando la base de datos de PostgreSQL con un negocio, tienda, usuarios, y productos.

### Rama
`ANTIGRAVITY-FEATS-7-backend-fixes`

---

## Fase 8: Retorno a Diseño Web Original y Abandono de Flutter — 2026-04-25 04:05 UTC-7

### Resumen
Siguiendo la solicitud del usuario, se ha revertido el trabajo de la Fase 4 y se ha decidido abandonar el desarrollo en Flutter para volver al diseño visual predeterminado del prototipo React (Vite + TanStack). El foco ahora es la integración de esta aplicación web con el backend FastAPI existente.

### Cambios Realizados
- **Dirección de Proyecto:** Se cancelan las fases 4, 5 y 6 que estaban orientadas a Flutter.
- **Frontend:** Se ha activado el servidor de desarrollo de React (`npm run dev`) en la raíz del proyecto.
- **Backend:** Se mantiene el backend de la Fase 7 (FastAPI + PostgreSQL) como fuente de verdad.
- **Plan de Implementación:** Actualizado para reflejar la integración de React con la API.

### Rama
`ANTIGRAVITY-FEATS-8-react-revert`
