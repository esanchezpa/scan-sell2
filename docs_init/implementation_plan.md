# Plan de Implementación: VentaFácil (Flutter + FastAPI + PostgreSQL)

El objetivo es migrar y desarrollar el sistema VentaFácil basándonos en los blueprints proveídos, pasando del prototipo React actual a una arquitectura definitiva de **Frontend en Flutter** y **Backend en FastAPI**, utilizando una base de datos **PostgreSQL** ya existente. El trabajo se realizará por fases iterativas, y cada fase se enviará a una nueva rama `ANTIGRAVITY-FEATS-[nombre-fase]` en el repositorio de GitHub.

## User Review Required

> [!WARNING]
> Dado que la base de datos de PostgreSQL actual (que hemos inspeccionado) contiene la mayoría de las tablas necesarias (`businesses`, `products`, `sales`, etc.) pero **NO contiene la tabla `settings`**, necesitaremos crear una migración de base de datos (`Alembic`) para agregar dicha tabla. ¿Estás de acuerdo con aplicar cambios al esquema de la base de datos en PostgreSQL para añadir `settings`?

> [!IMPORTANT]
> Se utilizará la estructura de directorios descrita en la documentación (`backend/` para Python/FastAPI y `frontend/` para Flutter). El código del prototipo actual en `src/` se mantendrá intacto únicamente como referencia visual y de flujos.
> 
> Además, se creará un archivo `CHANGES.md` en la raíz del proyecto. **Al finalizar cada fase, se documentarán (concisamente y a detalle, con fecha y hora) todos los cambios realizados en el archivo `CHANGES.md`, añadiendo la información sin sobrescribir el historial.**

## Open Questions

> [!NOTE]
> 1. Para la Fase 0 y el control de versiones: ¿Deseas que cada fase sea una PR separada hacia `main` o simplemente que vayamos empujando los commits a las ramas `ANTIGRAVITY-FEATS-*` y tú decides cuándo unirlas?
> 2. Para la conexión de la base de datos: ¿Debería configurar las variables de entorno de PostgreSQL (`DATABASE_URL`) y Redis apuntando a tu entorno de Docker Compose local (`docker-compose.yml` que crearemos)?

---

## Proposed Changes

La implementación se dividirá en las siguientes fases, basándose directamente en los archivos de documentación de apoyo (`.md`) indicados:

### Fase 0: Consolidación del Repositorio y Entorno
- **Archivos de Apoyo:** `CLAUDE.md`, `IMPLEMENTATION_PLAN_POSTGRESQL.md` (Sección Fase 0).
- **Ramas en Git:** Creación de rama base `ANTIGRAVITY-FEATS-0-setup`.
- **Registro:** Creación del archivo `CHANGES.md`.
- **Estructura:** Creación de carpetas `backend/` y `frontend/`.
- **Backend Setup:** Inicialización de entorno Python, configuración de `.env.example`, y configuración base de FastAPI.
- **Frontend Setup:** Inicialización del proyecto Flutter en `frontend/` (`flutter create .`).
- **Infraestructura Local:** Archivo `docker-compose.yml` básico para PostgreSQL y Redis locales.
- **Commit:** Registrar en `CHANGES.md` los cambios aplicados en la Fase 0 con fecha y hora.

### Fase 1: Inspección de PostgreSQL Existente y Modelos Base (Backend)
- **Archivos de Apoyo:** `IMPLEMENTATION_PLAN_POSTGRESQL.md` (Fase 1 y Fase 3), `SYSTEM_BLUEPRINT.md` (Sección 1: Arquitectura de Datos).
- **Ramas en Git:** Rama `ANTIGRAVITY-FEATS-1-db-models`.
- **Modelos SQLAlchemy:** Mapear en Python (`backend/app/models/`) las tablas detectadas (businesses, users, stores, categories, products, product_barcodes, stock_balances, sales, sale_items, sale_payments, inventory_movements).
- **Migraciones (Alembic):** Configurar Alembic y generar una migración para crear la tabla faltante `settings` sin alterar las tablas preexistentes.
- **Commit:** Registrar en `CHANGES.md` los cambios aplicados en la Fase 1 con fecha y hora.

### Fase 2: Infraestructura y Servicios (Backend)
- **Archivos de Apoyo:** `BACKEND_LOGIC.md`, `IMPLEMENTATION_PLAN_POSTGRESQL.md` (Fase 2 y Fase 4), `SYSTEM_BLUEPRINT.md` (Sección 2: Lógica de Negocio).
- **Ramas en Git:** Rama `ANTIGRAVITY-FEATS-2-services`.
- **Servicios Principales:** Desarrollo de la lógica de negocio (Products, Inventory, Sales, Reports, Barcode Lookup via OpenFoodFacts, Settings) en `backend/app/services/`.
- **Atomicidad y Transacciones:** Implementación estricta de control transaccional para evitar sobreventas, denormalizando costos e ingresos en `sale_items`.
- **Schemas y Routers:** Definición de contratos con Pydantic y exposición de servicios a través de API REST (`backend/app/routers/`).
- **Commit:** Registrar en `CHANGES.md` los cambios aplicados en la Fase 2 con fecha y hora.

### Fase 3: Arquitectura Base de Flutter (Frontend)
- **Archivos de Apoyo:** `FRONTEND_BLUEPRINT.md` (Sección 1 y 2), `IMPLEMENTATION_PLAN_POSTGRESQL.md` (Fase 5).
- **Ramas en Git:** Rama `ANTIGRAVITY-FEATS-3-flutter-base`.
- **Paquetes:** Instalar `flutter_riverpod`, `dio`, `go_router`, y dependencias visuales.
- **Router y Tematización:** Mapear la paleta de colores (HSL) y tipografías (Poppins, PT Sans) desde el prototipo actual para mantener una **fidelidad visual exacta**.
- **Estructura Interna:** Configuración de core, routing, y clientes de API HTTP.
- **Commit:** Registrar en `CHANGES.md` los cambios aplicados en la Fase 3 con fecha y hora.

### Fase 4: Pantallas Principales - Catálogo, Dashboard e Inventario (Frontend)
- **Archivos de Apoyo:** `FRONTEND_BLUEPRINT.md` (Sección 3: A y C), `SYSTEM_BLUEPRINT.md` (Sección 4).
- **Ramas en Git:** Rama `ANTIGRAVITY-FEATS-4-flutter-catalog`.
- **Catálogo:** Grid de productos, tarjetas de producto, creación, edición, y carga/autocompletado.
- **Dashboard:** Consumo de la API de reportes para mostrar gráficos, rentabilidad, y alertas de stock bajo.
- **Inventario:** Tablas y gestión de movimientos de inventario/alertas.
- **Commit:** Registrar en `CHANGES.md` los cambios aplicados en la Fase 4 con fecha y hora.

### Fase 5: Módulo de Punto de Venta (POS) y Lector Físico HID (Frontend)
- **Archivos de Apoyo:** `FRONTEND_BLUEPRINT.md` (Sección 3: B), `IMPLEMENTATION_PLAN_POSTGRESQL.md` (Fase 6), `SYSTEM_BLUEPRINT.md` (Sección 3: A).
- **Ramas en Git:** Rama `ANTIGRAVITY-FEATS-5-flutter-pos`.
- **UI de POS:** Diseño estilo registradora para laptops, carrito de compras con control de cantidades, y validación visual rápida.
- **Lector de Código de Barras Físico:** Implementación del flujo centrado en teclado (HID) utilizando un "listener" o Focus invisible que capture inputs continuos y haga checkout.
- **Commit:** Registrar en `CHANGES.md` los cambios aplicados en la Fase 5 con fecha y hora.

### Fase 6: Cámara Scanner, Configuraciones y Autocompletado (Frontend)
- **Archivos de Apoyo:** `FRONTEND_BLUEPRINT.md` (Sección 4: A, B y C), `SYSTEM_BLUEPRINT.md` (Sección 3: B).
- **Ramas en Git:** Rama `ANTIGRAVITY-FEATS-6-camera-scanner`.
- **Settings:** Pantalla de configuración global del dispositivo.
- **Scanner Cámara:** Integración de la vista de cámara (overlay, linterna, zoom) que funciona como input secundario si está habilitado.
- **OpenFoodFacts:** Auto-completado de productos desde la API externa utilizando loaders e IA simulada.
- **Commit:** Registrar en `CHANGES.md` los cambios aplicados en la Fase 6 con fecha y hora.

---

## Verification Plan

### Automated / API Tests
- Uso de `pytest` en el backend para validar que la transacción de ventas atómica (stock, inventory_movements, sales, sale_items) funciona como se espera e impide sobreventas si falta stock.
- Llamadas vía `mcp-toolbox-for-databases` para comprobar inserciones correctas de registros en Postgres sin romper lo pre-existente.

### Manual Verification
- Iniciar FastAPI localmente en el puerto 8000.
- Ejecutar la aplicación Flutter compilada y verificar visualmente la fidelidad frente a las directivas en `FRONTEND_BLUEPRINT.md` y `src/` (React).
- Conexión del frontend a los endpoints expuestos localmente.
- Escaneo con hardware lector (simulado a través del teclado físico) testeando inputs rápidos e ininterrumpidos en el POS.
- Confirmar que el archivo `CHANGES.md` tenga todo el historial preservado fase por fase.
