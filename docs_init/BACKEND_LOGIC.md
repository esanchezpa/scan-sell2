# Funcionalidad del Sistema: Backend y Lógica General

Este documento detalla la implementación técnica del servidor para **VentaFácil**, enfocado en un entorno FastAPI + SQLite/PostgreSQL.

---

## 1. Responsabilidades del Backend

El backend no es solo un puente de datos; es el guardián de la integridad del negocio. Sus responsabilidades son:
1. **Garantizar la Atomicidad:** Ninguna venta se registra si falla la actualización de stock.
2. **Denormalización de Precios:** Proteger los datos históricos ante cambios futuros en el catálogo.
3. **Gestión de Concurrencia:** Manejar múltiples dispositivos en red local.

---

## 2. Lógica de Servicios (Service Layer)

### A. `SalesService.create_sale(data)`
- **Entrada:** `seller_id`, `items` (lista de `product_id` y `quantity`).
- **Lógica:**
  1. Iniciar transacción de base de datos.
  2. Iterar por cada item:
     - Consultar producto actual.
     - Verificar `stock >= item.quantity`. Si no, lanzar error y hacer rollback.
     - Calcular subtotal usando el precio actual del catálogo.
     - Actualizar stock del producto.
  3. Calcular `total_amount` de la venta.
  4. Insertar en tabla `sales`.
  5. Insertar en tabla `sale_items` usando `price_at_sale` y `cost_at_sale` obtenidos del catálogo en el paso 2.
  6. Finalizar transacción.

### B. `InventoryService.get_alerts(seller_id)`
- **Lógica:** Ejecutar consulta filtrada: `WHERE stock <= low_stock_threshold`.
- **Retorno:** Lista de objetos producto simplificados para badges de notificación.

### C. `ProfitabilityService.get_monthly_report(seller_id, year, month)`
- **Lógica:**
  - Unir `sales` con `sale_items`.
  - Filtrar por `seller_id` y el rango de fechas del mes.
  - Aplicar la fórmula: `SUM((price_at_sale - cost_at_sale) * quantity)`.

---

## 3. Especificación de API (Endpoints Críticos)

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `POST` | `/sales` | Registra una nueva venta (Transaccional). |
| `DELETE` | `/sales/{id}` | Elimina una venta y restaura el stock. |
| `GET` | `/products/alerts` | Lista productos bajo el umbral de stock. |
| `GET` | `/analytics/profit` | Obtiene rentabilidad por mes/rango. |
| `GET` | `/ai/barcode/{code}` | Consulta externa a OpenFoodFacts y formatea respuesta. |

---

## 4. Gestión de Red y Base de Datos

### Conectividad Local
- **IP Binding:** El servidor debe escuchar en `0.0.0.0` para ser accesible por otros celulares en la misma Wi-Fi.
- **Descubrimiento:** Se recomienda que el servidor tenga una IP estática en la red local.

### Persistencia (SQLite/WAL)
Si se usa SQLite para simplicidad local:
- Debe activarse el modo **WAL (Write-Ahead Logging)** para permitir que un dispositivo lea mientras otro registra una venta sin bloquear la base de datos.
- `PRAGMA journal_mode=WAL;`

---

## 5. Reglas de Error y Validación
- **Error 400 (Bad Request):** Si el stock es insuficiente (mensaje: `STOCK_INSUFFICIENT`).
- **Error 404 (Not Found):** Si el código de barras no existe en OpenFoodFacts.
- **Seguridad:** Todas las consultas deben incluir el filtro `seller_id` para evitar fugas de datos entre usuarios (Multitenancy).
