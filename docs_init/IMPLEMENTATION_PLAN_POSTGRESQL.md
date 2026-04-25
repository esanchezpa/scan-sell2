# Implementation Plan: VentaFacil con Flutter, FastAPI, PostgreSQL y Lector Fisico

## 1. Objetivo

Este plan guia la implementacion de **VentaFacil** como un sistema POS para una tienda pequena tipo bazar, optimizado principalmente para una **laptop tactil en mostrador** con un **lector fisico de codigo de barras HID**.

La arquitectura objetivo es:

- **Frontend:** Flutter
- **Backend:** FastAPI
- **Database:** PostgreSQL ya existente
- **Cache/soporte opcional:** Redis
- **DB tooling para agentes:** `mcp-toolbox-for-databases`
- **Input principal de codigo de barras:** lector fisico HID tipo teclado
- **Input secundario:** camara, activable desde configuracion

El agente que implemente este plan debe tratar la app React/TanStack actual como **prototipo visual y funcional**, no como arquitectura final. La fuente oficial de datos debe vivir en PostgreSQL y las reglas de negocio deben vivir en FastAPI.

## 2. Contexto Existente

Archivos base que deben considerarse:

- `docs_init/FRONTEND_BLUEPRINT.md` -> UI/UX, paleta, navegacion, scanner por camara, estados visuales
- `docs_init/LOGICA_BD_RELACIONAL.md` -> modelo PostgreSQL recomendado, DDL, indices y consultas criticas
- `docs_init/SYSTEM_BLUEPRINT.md` -> entidades, flujo de venta, dashboard y OpenFoodFacts
- `docs_init/BACKEND_LOGIC.md` -> responsabilidades del backend, transacciones y endpoints criticos
- `src/` -> prototipo React/TanStack/Vite con Zustand/localStorage
- `src/lib/store.ts` -> seed data y forma actual de productos, ventas, clientes, proveedores e invoices

Decisiones cerradas:

- PostgreSQL reemplaza a SQLite como base principal.
- La base de datos PostgreSQL ya existe; antes de crear o modificar modelos/migraciones, inspeccionar el estado real.
- Redis es opcional y auxiliar.
- La app final se usara principalmente en laptop tactil.
- El lector fisico HID es el flujo principal de escaneo.
- La camara debe estar desactivada por defecto y solo mostrarse si `camera_scanner_enabled` esta activo.

## 3. Principios De Implementacion

- El backend es el guardian de la integridad del negocio.
- Flutter no debe calcular totales finales como fuente de verdad.
- Flutter puede mostrar subtotales temporales de carrito, pero FastAPI recalcula precios, costos, descuentos, impuestos y totales al registrar la venta.
- PostgreSQL es la fuente oficial de productos, stock, ventas, pagos y reportes.
- Redis nunca debe almacenar stock oficial ni ventas oficiales.
- Toda venta debe ser atomica: si falla un item, falla toda la venta.
- Todo cambio de stock debe registrar un movimiento en `inventory_movements`.
- No se deben borrar ventas completadas fisicamente durante operacion normal; usar estados.
- Rentabilidad historica siempre usa `sale_items.price_at_sale` y `sale_items.cost_at_sale`.
- Para lector fisico, optimizar velocidad y foco de teclado antes que experiencias de camara.

## 4. Fase 0: Consolidacion Del Repositorio

### Objetivo

Dejar claro el estado actual y preparar el repositorio para migrar desde prototipo React hacia monorepo Flutter/FastAPI.

### Tareas

1. Mantener `docs_init/` como fuente documental inicial.
2. Crear o actualizar `CLAUDE.md` en la raiz con reglas operativas del proyecto.
3. Documentar que `src/` es un prototipo React/TanStack:
   - sirve para copiar flujos, layout, nombres de pantallas, paleta e interacciones;
   - no debe conservarse como fuente de verdad de datos;
   - `src/lib/store.ts` no debe ser replicado como estado oficial.
4. Definir estructura final:
   - `backend/` para FastAPI.
   - `frontend/` para Flutter.
   - `docs_init/` para documentos tecnicos.
5. Antes de implementar schema, inspeccionar PostgreSQL real con `mcp-toolbox-for-databases`.

### Criterios de aceptacion

- Existe guia de agente en `CLAUDE.md`.
- Existe plan PostgreSQL detallado en `docs_init/IMPLEMENTATION_PLAN_POSTGRESQL.md`.
- Queda explicito que el destino no es React, sino Flutter + FastAPI.

## 5. Fase 1: Inspeccion De PostgreSQL Existente

### Objetivo

Conocer la BD ya creada antes de generar modelos o migraciones.

### Uso recomendado de mcp-toolbox-for-databases

El agente puede usar `mcp-toolbox-for-databases` para:

- listar bases, schemas y tablas;
- inspeccionar columnas, tipos, indices, constraints y foreign keys;
- ejecutar consultas read-only de verificacion;
- comparar la BD real con `LOGICA_BD_RELACIONAL.md`;
- validar que las migraciones propuestas no dupliquen objetos existentes.

### Reglas

- Usar herramientas de DB primero para descubrir, no para mutar.
- No ejecutar `DROP`, `TRUNCATE`, `DELETE`, `ALTER`, `UPDATE` manual o destructivo sin instruccion explicita del usuario.
- Si la BD ya tiene tablas equivalentes, adaptar modelos y migraciones a lo existente.
- Si faltan tablas, crear migraciones Alembic incrementales.

### Checklist de inspeccion

Verificar existencia y forma de:

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

Verificar indices minimos:

- productos por `business_id` y nombre;
- codigos por `business_id` y barcode;
- ventas por `business_id` y fecha;
- ventas por `store_id` y fecha;
- detalle de venta por `sale_id`;
- movimientos por producto/tienda y fecha;
- stock por `store_id`, `product_id`;
- consultas de bajo stock.

### Criterios de aceptacion

- El agente conoce si las tablas ya existen.
- El agente sabe que migraciones son necesarias y cuales no.
- No se generan modelos incompatibles con la BD real.

## 6. Fase 2: Infraestructura Backend

### Objetivo

Crear backend FastAPI conectado a PostgreSQL existente y preparado para Redis opcional.

### Estructura objetivo

```text
backend/
  app/
    main.py
    config.py
    database.py
    routers/
      health.py
      products.py
      inventory.py
      sales.py
      reports.py
      barcode.py
      settings.py
    services/
      products_service.py
      inventory_service.py
      sales_service.py
      reports_service.py
      barcode_service.py
      settings_service.py
      redis_cache_service.py
    models/
    schemas/
    utils/
  alembic/
  tests/
```

### Dependencias recomendadas

- `fastapi`
- `uvicorn[standard]`
- `sqlalchemy`
- `alembic`
- `psycopg[binary]` or `asyncpg` depending on sync/async choice
- `pydantic-settings`
- `redis`
- `httpx`
- `pytest`

### Configuracion

Variables:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET_KEY`
- `OPENFOODFACTS_BASE_URL`
- `APP_HOST=0.0.0.0`
- `APP_PORT=8000`
- `CORS_ORIGINS`

### CORS LAN

Permitir origenes necesarios para desarrollo local y Flutter web si aplica. En laptop local, el backend debe escuchar en `0.0.0.0` para permitir conexiones desde otros dispositivos si se usan.

### Healthcheck

Crear:

- `GET /health`

Respuesta sugerida:

```json
{
  "status": "ok",
  "database": "ok",
  "redis": "ok_or_unavailable",
  "version": "0.1.0"
}
```

Redis puede estar unavailable sin romper el sistema.

### Criterios de aceptacion

- FastAPI inicia con PostgreSQL.
- `GET /health` confirma conexion a DB.
- Redis caido no impide levantar backend.
- Backend corre en `0.0.0.0:8000`.

## 7. Fase 3: Modelo Relacional PostgreSQL

### Objetivo

Alinear SQLAlchemy/Alembic con la BD PostgreSQL existente y el modelo de `LOGICA_BD_RELACIONAL.md`.

### Tablas objetivo

#### `businesses`

Representa el negocio.

Campos clave:

- `id`
- `name`
- `created_at`

#### `users`

Usuarios del negocio.

Campos clave:

- `id`
- `business_id`
- `firebase_uid` opcional si se conserva auth externa
- `name`
- `email`
- `role`: `owner`, `admin`, `cashier`
- `is_active`
- `created_at`

#### `stores`

Sucursal o punto de venta.

Campos clave:

- `id`
- `business_id`
- `name`
- `address`
- `created_at`

Para primera version puede existir una tienda default.

#### `categories`

Categorias de productos.

Campos clave:

- `id`
- `business_id`
- `name`
- `created_at`

Categorias iniciales sugeridas:

- Bebidas
- Snacks
- Lacteos
- Abarrotes
- Limpieza
- Cuidado Personal
- Panaderia
- Frutas y Verduras
- Congelados
- Otros

#### `products`

Catalogo de productos.

Campos clave:

- `id`
- `business_id`
- `category_id`
- `name`
- `description`
- `price NUMERIC(12,2)`
- `cost NUMERIC(12,2)`
- `low_stock_threshold`
- `image_url`
- `is_active`
- `created_at`
- `updated_at`

#### `product_barcodes`

Codigos de barras multiples por producto.

Campos clave:

- `id`
- `business_id`
- `product_id`
- `barcode`
- `is_primary`
- `created_at`

Regla:

- `UNIQUE (business_id, barcode)`

#### `stock_balances`

Stock oficial por tienda y producto.

Campos clave:

- `id`
- `store_id`
- `product_id`
- `stock`
- `updated_at`

Regla:

- `UNIQUE (store_id, product_id)`

#### `sales`

Cabecera de venta.

Campos clave:

- `id`
- `business_id`
- `store_id`
- `cashier_id`
- `status`: `pending`, `completed`, `cancelled`, `refunded`, `partially_refunded`
- `subtotal NUMERIC(12,2)`
- `discount_total NUMERIC(12,2)`
- `tax_total NUMERIC(12,2)`
- `total_amount NUMERIC(12,2)`
- `client_generated_id UUID`
- `created_at`

Regla:

- `UNIQUE (business_id, client_generated_id)` para evitar duplicados futuros.

#### `sale_items`

Detalle historico de venta.

Campos clave:

- `id`
- `sale_id`
- `product_id`
- `product_name_at_sale`
- `barcode_at_sale`
- `quantity`
- `price_at_sale NUMERIC(12,2)`
- `cost_at_sale NUMERIC(12,2)`
- `discount_amount NUMERIC(12,2)`

Regla:

- La rentabilidad se calcula usando estos campos historicos.

#### `sale_payments`

Pagos de una venta.

Campos clave:

- `id`
- `sale_id`
- `payment_method`: `cash`, `card`, `yape`, `plin`, `transfer`, `other`
- `amount NUMERIC(12,2)`
- `reference_code`
- `created_at`

#### `inventory_movements`

Auditoria de stock.

Campos clave:

- `id`
- `business_id`
- `store_id`
- `product_id`
- `movement_type`: `purchase`, `sale`, `return`, `adjustment`, `initial_stock`
- `quantity` positivo para entradas, negativo para salidas
- `reference_type`
- `reference_id`
- `notes`
- `created_by`
- `created_at`

#### `settings`

Configuracion por negocio, tienda o dispositivo.

Campos minimos sugeridos:

- `id`
- `business_id`
- `store_id` nullable
- `key`
- `value JSONB` or `TEXT`
- `created_at`
- `updated_at`

Settings iniciales:

- `camera_scanner_enabled`: false
- `default_store_id`
- `store_name`
- `backend_url`
- `scanner_mode`: `physical_hid`

### Criterios de aceptacion

- Modelos SQLAlchemy representan la BD real.
- Dinero usa Decimal/NUMERIC, no float.
- Indices criticos existen.
- `product_barcodes` soporta multiples codigos por producto.
- `stock_balances` es la fuente oficial de stock.

## 8. Fase 4: Backend APIs y Servicios

## 8.1 Products

### Endpoints

- `GET /products`
- `POST /products`
- `PATCH /products/{id}`
- `GET /products/barcode/{barcode}`

### `GET /products`

Parametros:

- `business_id`
- `store_id`
- `query` opcional
- `category_id` opcional
- `is_active` default true
- `limit`, `offset`

Debe devolver producto con stock para la tienda seleccionada.

### `POST /products`

Debe crear:

- producto;
- barcode primario si se envia;
- stock inicial en `stock_balances`;
- movimiento `initial_stock` si stock inicial > 0.

### `PATCH /products/{id}`

Permite editar:

- nombre;
- descripcion;
- categoria;
- precio;
- costo;
- umbral de stock bajo;
- imagen;
- estado activo.

No debe cambiar ventas historicas.

### `GET /products/barcode/{barcode}`

Debe buscar en `product_barcodes` filtrando por `business_id`.

Si existe:

- devolver producto;
- devolver stock de `stock_balances` para `store_id`;
- devolver categoria y barcode primario.

Si no existe:

- responder 404 con codigo funcional `PRODUCT_NOT_FOUND_BY_BARCODE`.

## 8.2 Inventory

### Endpoints

- `GET /inventory/low-stock`
- `GET /inventory/movements`
- `POST /inventory/adjustments`

### Reglas

- Cualquier ajuste manual actualiza `stock_balances`.
- Cualquier ajuste manual crea `inventory_movements` con `movement_type='adjustment'`.
- El stock nunca se actualiza desde Flutter directamente.

## 8.3 Sales

### Endpoints

- `POST /sales`
- `GET /sales`
- `POST /sales/{id}/cancel`

### `POST /sales`

El request debe recibir productos, cantidades, pagos y metadata. No debe confiar en precios enviados por frontend.

Request sugerido:

```json
{
  "business_id": 1,
  "store_id": 1,
  "cashier_id": 1,
  "client_generated_id": "550e8400-e29b-41d4-a716-446655440000",
  "items": [
    {
      "product_id": 10,
      "quantity": 2
    }
  ],
  "payments": [
    {
      "payment_method": "cash",
      "amount": "20.00",
      "reference_code": null
    }
  ]
}
```

Backend debe:

1. Abrir transaccion.
2. Validar negocio, tienda y cajero.
3. Validar items no vacios.
4. Agrupar items repetidos por `product_id`.
5. Bloquear o actualizar stock de forma atomica.
6. Validar `stock >= quantity` en `stock_balances`.
7. Leer `products.price`, `products.cost`, nombre y barcode primario.
8. Crear `sales`.
9. Crear `sale_items` con snapshots historicos.
10. Descontar `stock_balances`.
11. Crear `inventory_movements` negativos con `movement_type='sale'`.
12. Crear `sale_payments`.
13. Recalcular subtotal, descuento, impuesto y total en backend.
14. Verificar que suma de pagos cubre el total si la venta se marca completed.
15. Confirmar transaccion.

Errores funcionales sugeridos:

- `PRODUCT_NOT_FOUND`
- `PRODUCT_INACTIVE`
- `STOCK_BALANCE_NOT_FOUND`
- `STOCK_INSUFFICIENT`
- `PAYMENT_AMOUNT_INVALID`
- `DUPLICATE_CLIENT_GENERATED_ID`

### `POST /sales/{id}/cancel`

Debe:

1. Abrir transaccion.
2. Validar que la venta existe y esta `completed`.
3. Cambiar estado a `cancelled`.
4. Por cada item, sumar stock en `stock_balances`.
5. Crear `inventory_movements` positivos con `movement_type='return'` y referencia a la venta.
6. No borrar `sales`, `sale_items` ni `sale_payments`.

## 8.4 Reports

### Endpoint

- `GET /reports/dashboard`

Parametros:

- `business_id`
- `store_id` opcional
- `from`
- `to`

Debe devolver:

- ventas totales;
- cantidad de ventas;
- utilidad bruta;
- productos top;
- ventas por categoria;
- productos bajo stock;
- productos agotados.

Regla critica:

```text
utilidad = SUM((sale_items.price_at_sale - sale_items.cost_at_sale) * sale_items.quantity)
```

Nunca usar `products.cost` actual para ventas historicas.

## 8.5 Barcode Externo

### Endpoint

- `GET /barcode/lookup/{barcode}`

Flujo:

1. Buscar en Redis cache si esta disponible.
2. Si no hay cache, llamar OpenFoodFacts.
3. Normalizar respuesta a nombre, descripcion, marca, imagen.
4. Guardar cache temporal en Redis si disponible.
5. Si OpenFoodFacts falla, responder 404/502 segun caso, sin bloquear alta manual.

## 8.6 Settings

### Endpoints

- `GET /settings`
- `PATCH /settings`

Settings iniciales:

```json
{
  "camera_scanner_enabled": false,
  "scanner_mode": "physical_hid",
  "default_store_id": 1,
  "store_name": "Mi Tienda",
  "backend_url": "http://127.0.0.1:8000"
}
```

Regla:

- La UI de camara solo se muestra si `camera_scanner_enabled` es true.

## 9. Fase 5: Flutter App

### Objetivo

Crear app Flutter orientada a laptop tactil, con POS rapido y lector fisico HID como flujo principal.

### Dependencias recomendadas

- `flutter_riverpod`
- `dio`
- `go_router`
- `freezed_annotation`
- `json_annotation`
- `intl`
- `mobile_scanner` o alternativa para camara
- `shared_preferences` para settings locales
- `drift`, `hive`, o `isar` solo si se implementa cache local

### Estructura por features

```text
frontend/lib/
  main.dart
  core/
    config/
    http/
    errors/
    formatting/
  routes/
  models/
  api/
  providers/
  shared/
    widgets/
    dialogs/
    theme/
  features/
    dashboard/
    sales/
    catalog/
    inventory/
    reports/
    settings/
    barcode/
```

### UX para laptop tactil

Priorizar:

- Layout amplio tipo caja registradora.
- Botones grandes para tactil.
- Busqueda y scanner siempre accesibles.
- Carrito visible mientras se venden productos.
- Total grande y fijo.
- Accion de checkout clara.
- Feedback rapido tras cada escaneo.

### Pantallas

#### Dashboard

Debe mostrar:

- Ventas del periodo.
- Utilidad bruta.
- Productos estrella.
- Ventas por categoria.
- Stock bajo y agotados.

Fuente:

- `GET /reports/dashboard`

#### POS / Sales

Debe incluir:

- Campo/focus para lector fisico HID.
- Buscador manual por texto.
- Boton de camara solo si setting activo.
- Lista de resultados.
- Carrito con cantidad, subtotal y stock disponible.
- Metodos de pago.
- Boton completar venta.
- Historial de ventas.

#### Catalog

Debe incluir:

- Grid/lista de productos.
- Crear producto.
- Editar producto.
- Gestionar barcode primario.
- Alta desde barcode desconocido.
- Imagen desde archivo/camara si se implementa.

#### Inventory

Debe incluir:

- Stock por producto.
- Bajo stock.
- Agotados.
- Ajuste manual con motivo.
- Historial de movimientos si se requiere.

#### Settings

Debe incluir:

- URL/IP del backend.
- Test de conexion.
- Toggle `camera_scanner_enabled`.
- Modo scanner: `physical_hid`, `camera`, `both`, aunque default debe ser `physical_hid`.
- Nombre de tienda.
- Datos del dispositivo.

## 10. Fase 6: Lector Fisico HID

### Objetivo

Hacer que el flujo principal de venta sea rapido, estable y sin friccion usando el lector fisico.

### Comportamiento esperado

1. Usuario abre POS.
2. La app mantiene foco en un input invisible o campo dedicado.
3. Cajero escanea producto con lector fisico.
4. El lector escribe el barcode y envia Enter.
5. Flutter captura el barcode completo.
6. Flutter llama `GET /products/barcode/{barcode}`.
7. Si existe y hay stock, agrega 1 unidad al carrito.
8. Si existe pero no hay stock, muestra error tactil/sonoro/visual.
9. Si no existe, abre alta rapida con barcode precargado.
10. El foco vuelve automaticamente al scanner input.

### Reglas de implementacion

- No requerir click manual despues de cada scan.
- No abrir teclado virtual si el input esta oculto en laptop tactil.
- Normalizar barcode quitando espacios y saltos.
- Debounce muy corto si el scanner manda Enter rapido.
- Prevenir doble alta o doble agregado si el scanner emite duplicados.
- Mostrar toast/snackbar con resultado.
- Mantener un log visual de ultimos scans opcionalmente.

### Estados de scan

- `idle`
- `reading`
- `lookup_loading`
- `added_to_cart`
- `not_found`
- `stock_insufficient`
- `backend_unavailable`

## 11. Fase 7: Scanner Por Camara

### Objetivo

Mantener camara como flujo secundario, no como default.

### Settings

- `camera_scanner_enabled=false` por defecto.
- Si false, ocultar botones de camara en POS y Catalog.
- Si true, mostrar boton de camara.

### Comportamiento

1. Usuario activa scanner por camara en Settings.
2. UI muestra boton de camara.
3. Al abrir camara, solicitar permisos.
4. Escanear EAN-13, EAN-8, UPC-A, UPC-E, Code 128.
5. Vibrar o dar feedback al detectar.
6. Cerrar camara y procesar igual que el lector fisico.

### Criterios de aceptacion

- Camara no aparece si setting esta apagado.
- Camara aparece si setting esta encendido.
- Un scan por camara usa el mismo flujo backend que el lector fisico.
- Fallas de permiso no rompen POS.

## 12. Fase 8: Migracion Desde Prototipo React

### Objetivo

Replicar funcionalidades utiles del prototipo actual sin arrastrar decisiones de arquitectura incorrectas.

### Migrar como referencia visual

Desde `src/routes` y `src/components`:

- Dashboard cards.
- Bottom navigation.
- Sales/POS flow.
- Catalog grid.
- Product dialog.
- Barcode scanner behavior.
- Inventory table.
- Settings sections.

### No migrar como fuente final

No conservar:

- Zustand como store oficial.
- localStorage como BD.
- Seed products como verdad.
- Descuento de stock desde frontend.
- Ventas creadas localmente sin transaccion backend.

### Datos seed

Los seed actuales pueden convertirse en script opcional para poblar PostgreSQL en desarrollo, pero deben pasar por servicios o seeds controlados.

## 13. Fase 9: Redis Opcional

### Usos permitidos

- Cache de OpenFoodFacts por barcode.
- Cache de producto por barcode para lecturas rapidas.
- Rate limiting.
- Pub/sub para avisar a otras pantallas/dispositivos que cambio stock.
- Reportes precalculados.
- Locks temporales si se justifica.

### Usos prohibidos

- Stock oficial.
- Venta oficial.
- Pagos oficiales.
- Inventario historico oficial.

### Degradacion

Si Redis esta caido:

- ventas siguen funcionando;
- inventario sigue funcionando;
- reportes siguen funcionando desde PostgreSQL;
- solo se pierde cache/pubsub/rate limit.

## 14. Public APIs / Interfaces

Endpoints minimos:

- `GET /health`
- `GET /products`
- `POST /products`
- `PATCH /products/{id}`
- `GET /products/barcode/{barcode}`
- `GET /inventory/low-stock`
- `POST /sales`
- `POST /sales/{id}/cancel`
- `GET /sales`
- `GET /reports/dashboard`
- `GET /barcode/lookup/{barcode}`
- `GET /settings`
- `PATCH /settings`

### Contratos importantes

`POST /sales` recibe:

- negocio;
- tienda;
- cajero;
- items con `product_id` y `quantity`;
- pagos;
- metadata como `client_generated_id`.

`POST /sales` no debe aceptar como verdad:

- precio final calculado por Flutter;
- costo calculado por Flutter;
- stock calculado por Flutter;
- utilidad calculada por Flutter.

El backend calcula:

- precio historico;
- costo historico;
- subtotal;
- descuentos;
- impuestos;
- total;
- utilidad;
- movimientos de inventario.

## 15. Test Plan

### Backend tests

1. Crear producto con barcode y stock inicial.
2. Buscar producto por barcode existente.
3. Buscar barcode inexistente retorna 404 funcional.
4. Crear venta descuenta stock.
5. Crear venta genera `sale_items` con nombre, barcode, precio y costo historicos.
6. Crear venta genera `sale_payments`.
7. Crear venta genera `inventory_movements` negativos.
8. Venta con stock insuficiente hace rollback total.
9. Venta con producto inactivo falla.
10. Venta duplicada con mismo `client_generated_id` no duplica datos.
11. Cancelar venta cambia status y restaura stock.
12. Cancelar venta genera movimientos positivos.
13. Rentabilidad mensual usa `sale_items.cost_at_sale`.
14. Redis caido no rompe `POST /sales`.
15. `GET /health` reporta DB ok y Redis opcional.

### Database checks

1. Constraints impiden stock negativo.
2. `UNIQUE (business_id, barcode)` impide barcode duplicado.
3. Indices de barcode existen.
4. Indices de ventas por fecha existen.
5. Foreign keys conectan venta, items, pagos y movimientos.
6. Dinero usa `NUMERIC(12,2)` o equivalente.

### Flutter tests

1. POS mantiene foco para lector fisico.
2. Scan HID + Enter agrega producto al carrito.
3. Scan desconocido abre alta rapida.
4. Scan sin stock muestra error.
5. Boton completar venta esta deshabilitado con carrito vacio.
6. Checkout exitoso limpia carrito y muestra confirmacion.
7. Backend desconectado muestra error claro.
8. Camara oculta cuando `camera_scanner_enabled=false`.
9. Camara visible cuando `camera_scanner_enabled=true`.
10. Dashboard renderiza datos desde API.

### Manual acceptance tests en laptop tactil

1. Conectar lector fisico USB/Bluetooth HID.
2. Abrir POS.
3. Escanear 10 productos seguidos sin tocar pantalla.
4. Confirmar que todos se agregan o muestran error correcto.
5. Cambiar cantidades con botones tactiles.
6. Completar venta con pago efectivo.
7. Verificar stock actualizado.
8. Verificar venta en historial.
9. Cancelar venta y confirmar stock restaurado.
10. Reiniciar backend y confirmar que datos persisten en PostgreSQL.

## 16. Orden Recomendado Para El Agente

1. Leer `CLAUDE.md`.
2. Leer este plan.
3. Leer `LOGICA_BD_RELACIONAL.md`.
4. Usar `mcp-toolbox-for-databases` para inspeccionar PostgreSQL existente.
5. Comparar DB real contra el modelo objetivo.
6. Crear backend base si no existe.
7. Configurar SQLAlchemy/Alembic contra la DB real.
8. Implementar modelos/schemas minimos.
9. Implementar products y barcode lookup.
10. Implementar stock/inventory.
11. Implementar sales transaction.
12. Implementar reports.
13. Implementar settings.
14. Crear Flutter app base.
15. Implementar POS para laptop tactil y lector HID.
16. Implementar catalog/inventory/dashboard.
17. Agregar camara opcional.
18. Correr pruebas backend y validacion manual con lector fisico.

## 17. Riesgos Y Decisiones

### Riesgo: DB existente no coincide con blueprint

Accion:

- Inspeccionar con `mcp-toolbox-for-databases`.
- Adaptar modelos al estado real.
- Crear migraciones incrementales, no recrear todo.

### Riesgo: lector HID pierde foco

Accion:

- Crear scanner input dedicado.
- Restaurar foco despues de cada operacion.
- Evitar dialogs que roben foco durante venta normal.

### Riesgo: ventas duplicadas por doble Enter

Accion:

- Usar buffer y debounce.
- En checkout usar `client_generated_id`.
- Deshabilitar boton de venta mientras `POST /sales` esta en curso.

### Riesgo: reportes incorrectos por precio actual

Accion:

- Usar exclusivamente `sale_items.price_at_sale` y `sale_items.cost_at_sale`.
- Agregar tests que cambien precio despues de vender.

### Riesgo: Redis tratado como dependencia obligatoria

Accion:

- Encapsular Redis en servicio tolerante a fallos.
- Tests con Redis unavailable.

## 18. Done Definition

La implementacion se considera lista cuando:

- Backend FastAPI corre contra PostgreSQL existente.
- Flutter POS funciona en laptop tactil.
- Lector fisico HID agrega productos sin tocar pantalla entre scans.
- Ventas son transaccionales y auditablemente actualizan stock.
- Dashboard y reportes salen desde PostgreSQL.
- Camara se puede activar/desactivar desde settings.
- Redis es opcional.
- Los tests criticos de venta, stock, cancelacion y rentabilidad pasan.
- La documentacion refleja la arquitectura real.
