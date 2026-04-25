# BluePrint Técnico: VentaFácil (Arquitectura y Lógica)

Este documento contiene la especificación completa para replicar la lógica, estructura y flujo de la aplicación "VentaFácil" en cualquier stack tecnológico.

---

## 1. Arquitectura de Datos (Entidades y Relaciones)

### A. Producto (`Producto`)
Representa el inventario. Es la entidad base para el catálogo.
- **Campos:**
  - `id`: Identificador único.
  - `nombre`: Texto (mín. 3 caracteres).
  - `precio`: Decimal (Precio de venta al público).
  - `costo`: Decimal (Precio de adquisición, vital para rentabilidad).
  - `stock`: Entero (Cantidad actual).
  - `codigo_barras`: Texto (Único, usado para búsquedas rápidas).
  - `categoria`: Texto (Enum: Bebidas, Snacks, Lácteos, Abarrotes, Limpieza, Cuidado Personal, Panadería, Frutas y Verduras, Congelados, Otros).
  - `umbral_stock_bajo`: Entero (Disparador de alertas, default: 5).
  - `url_imagen`: Texto (Path local o URL).

### B. Venta (`Venta`)
Registro de una transacción completada.
- **Campos:**
  - `id`: Identificador único.
  - `fecha`: DateTime (Timestamp de la operación).
  - `total`: Decimal (Suma de los subtotales de los items).
  - **Relación:** Uno a Muchos con `VentaItem`.

### C. Detalle de Venta (`VentaItem`)
**CRUCIAL:** Almacena la foto del estado del producto al momento de la venta.
- **Campos:**
  - `venta_id`: FK a Venta.
  - `producto_id`: FK a Producto.
  - `cantidad`: Entero.
  - `precio_historico`: Decimal (El precio al que se vendió, no el actual del catálogo).
  - `costo_historico`: Decimal (El costo al momento de la venta para reportes exactos).

---

## 2. Lógica de Negocio (Algoritmos Críticos)

### A. Transacción de Venta (Check-out)
Para garantizar la integridad, la operación debe ser atómica (transaccional):
1. **Validación:** Verificar disponibilidad de stock para cada item del carrito.
2. **Descuento:** `Producto.stock = Producto.stock - CantidadVendida`.
3. **Persistencia:** Crear registro `Venta`.
4. **Denormalización:** Crear `VentaItem` copiando `precio` y `costo` actuales del `Producto` a los campos `historicos`.

### B. Eliminación de Venta (Rollback Manual)
1. **Restauración:** Por cada item en la venta, `Producto.stock = Producto.stock + CantidadVendida`.
2. **Borrado:** Eliminar `VentaItem` y luego `Venta`.

### C. Cálculos del Dashboard (Agregaciones)
- **Ventas Mensuales:** Suma de `Venta.total` donde `Venta.fecha` esté en el mes actual.
- **Rentabilidad Neta:** Suma de `(VentaItem.precio_historico - VentaItem.costo_historico) * VentaItem.cantidad` del mes actual.
- **Top 5 Productos:** Agrupar `VentaItem` por `producto_id`, sumar `cantidad`, ordenar desc, tomar 5.
- **Alertas de Stock:** `SELECT * FROM Producto WHERE stock <= umbral_stock_bajo`.

---

## 3. Funcionalidades Técnicas Requeridas

### A. Escáner de Código de Barras
- **Capacidad:** Debe detectar formatos EAN-13, EAN-8, UPC-A, UPC-E y Code 128.
- **Flujo:** 
  - Si el código existe en la DB: Abrir detalle del producto.
  - Si no existe: Abrir formulario de creación con el código pre-cargado.

### B. Integración con OpenFoodFacts (IA/Servicio Externo)
- **Endpoint:** `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
- **Lógica:** Al ingresar un código nuevo, el sistema debe consultar este servicio para auto-completar `nombre` y `url_imagen`.

---

## 4. UI/UX Flow (Navegación)

1. **Dashboard (Inicio):** Visión 360 del negocio (Ventas, Rentabilidad, Alertas).
2. **Ventas (POS):** Búsqueda por texto o cámara, gestión de carrito y finalización.
3. **Catálogo:** Gestión CRUD de productos.
4. **Inventario:** Reporte tabular y exportación CSV.
