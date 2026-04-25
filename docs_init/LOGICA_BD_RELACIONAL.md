# Modelo Relacional de Base de Datos - VentaFácil (PostgreSQL)

Este documento detalla la estructura relacional recomendada para recrear y mejorar la base de datos de **VentaFácil** en un entorno PostgreSQL.

El modelo está pensado para una app de tienda/POS construida con:

- **Flutter** para la app móvil/web.
- **FastAPI** como backend.
- **PostgreSQL** como base de datos principal.
- **SQLite / Hive / Isar** opcional para cache local u operación offline.
- **Redis** opcional para cache del backend.

---

## 1. Objetivo del Modelo

El objetivo es soportar correctamente:

- Gestión de negocios o tiendas.
- Usuarios y roles.
- Sucursales o puntos de venta.
- Catálogo de productos.
- Códigos de barras múltiples por producto.
- Stock por tienda.
- Historial de movimientos de inventario.
- Ventas y detalle de ventas.
- Pagos con distintos métodos.
- Reportes de rentabilidad.
- Compatibilidad con lector físico de código de barras.
- Sincronización futura con modo offline.

---

## 2. Diagrama de Entidad-Relación (EER)

Relaciones principales:

- **Businesses** 1 --- N **Users**
- **Businesses** 1 --- N **Stores**
- **Businesses** 1 --- N **Products**
- **Businesses** 1 --- N **Categories**
- **Categories** 1 --- N **Products**
- **Products** 1 --- N **Product_Barcodes**
- **Stores** 1 --- N **Stock_Balances**
- **Products** 1 --- N **Stock_Balances**
- **Stores** 1 --- N **Sales**
- **Users** 1 --- N **Sales**
- **Sales** 1 --- N **Sale_Items**
- **Sales** 1 --- N **Sale_Payments**
- **Products** 1 --- N **Sale_Items**
- **Products** 1 --- N **Inventory_Movements**
- **Stores** 1 --- N **Inventory_Movements**

Representación simple:

```text
Businesses
 ├── Users
 ├── Stores
 ├── Categories
 ├── Products
 │    ├── Product_Barcodes
 │    ├── Stock_Balances
 │    ├── Sale_Items
 │    └── Inventory_Movements
 └── Sales
      ├── Sale_Items
      └── Sale_Payments


DDL---------------------------------------------------------------------------------------------

-- Extensión para UUIDs, útil para sincronización offline y client_generated_id
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. Negocios / Empresas
-- ============================================================
CREATE TABLE businesses (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. Usuarios
-- ============================================================
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    firebase_uid VARCHAR(128) UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,

    role VARCHAR(30) NOT NULL DEFAULT 'admin'
        CHECK (role IN ('owner', 'admin', 'cashier')),

    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (business_id, email)
);

-- ============================================================
-- 3. Tiendas / Sucursales / Puntos de venta
-- ============================================================
CREATE TABLE stores (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    address TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. Categorías
-- ============================================================
CREATE TABLE categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (business_id, name)
);

-- ============================================================
-- 5. Productos
-- ============================================================
CREATE TABLE products (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    cost NUMERIC(12, 2) NOT NULL CHECK (cost >= 0),

    low_stock_threshold INTEGER NOT NULL DEFAULT 5
        CHECK (low_stock_threshold >= 0),

    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- ============================================================
-- 6. Códigos de barras de productos
-- ============================================================
CREATE TABLE product_barcodes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    barcode VARCHAR(100) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Un negocio no puede tener dos productos con el mismo código de barras
    UNIQUE (business_id, barcode)
);

-- ============================================================
-- 7. Stock actual por tienda y producto
-- ============================================================
CREATE TABLE stock_balances (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (store_id, product_id)
);

-- ============================================================
-- 8. Ventas
-- ============================================================
CREATE TABLE sales (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    store_id BIGINT NOT NULL REFERENCES stores(id),
    cashier_id BIGINT REFERENCES users(id),

    status VARCHAR(30) NOT NULL DEFAULT 'completed'
        CHECK (status IN (
            'pending',
            'completed',
            'cancelled',
            'refunded',
            'partially_refunded'
        )),

    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    discount_total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
    tax_total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),

    -- ID generado por el cliente Flutter para evitar duplicados al sincronizar offline
    client_generated_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (business_id, client_generated_id)
);

-- ============================================================
-- 9. Detalle de ventas
-- ============================================================
CREATE TABLE sale_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,

    -- Puede quedar NULL si el producto fue eliminado del catálogo
    product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,

    -- Campos históricos para no depender del producto actual
    product_name_at_sale VARCHAR(255) NOT NULL,
    barcode_at_sale VARCHAR(100),

    quantity INTEGER NOT NULL CHECK (quantity > 0),

    price_at_sale NUMERIC(12, 2) NOT NULL CHECK (price_at_sale >= 0),
    cost_at_sale NUMERIC(12, 2) NOT NULL CHECK (cost_at_sale >= 0),

    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0)
);

-- ============================================================
-- 10. Pagos de ventas
-- ============================================================
CREATE TABLE sale_payments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,

    payment_method VARCHAR(30) NOT NULL
        CHECK (payment_method IN (
            'cash',
            'card',
            'yape',
            'plin',
            'transfer',
            'other'
        )),

    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),

    reference_code VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 11. Movimientos de inventario
-- ============================================================
CREATE TABLE inventory_movements (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    store_id BIGINT NOT NULL REFERENCES stores(id),
    product_id BIGINT NOT NULL REFERENCES products(id),

    movement_type VARCHAR(30) NOT NULL
        CHECK (movement_type IN (
            'purchase',
            'sale',
            'return',
            'adjustment',
            'initial_stock'
        )),

    -- Positivo para entradas, negativo para salidas
    quantity INTEGER NOT NULL,

    -- Ejemplo: sale, purchase, adjustment
    reference_type VARCHAR(30),
    reference_id BIGINT,

    notes TEXT,
    created_by BIGINT REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INDICES ----------------------------------------------------------------------------------------

-- Búsqueda de productos por negocio y nombre
CREATE INDEX idx_products_business_name
ON products(business_id, name);

-- Búsqueda rápida por código de barras
CREATE INDEX idx_product_barcodes_business_barcode
ON product_barcodes(business_id, barcode);

-- Ventas por negocio y fecha
CREATE INDEX idx_sales_business_created_at
ON sales(business_id, created_at DESC);

-- Ventas por tienda y fecha
CREATE INDEX idx_sales_store_created_at
ON sales(store_id, created_at DESC);

-- Detalle de venta por venta
CREATE INDEX idx_sale_items_sale
ON sale_items(sale_id);

-- Detalle de venta por producto
CREATE INDEX idx_sale_items_product
ON sale_items(product_id);

-- Movimientos de inventario por producto y fecha
CREATE INDEX idx_inventory_product_created_at
ON inventory_movements(product_id, created_at DESC);

-- Movimientos de inventario por tienda y fecha
CREATE INDEX idx_inventory_store_created_at
ON inventory_movements(store_id, created_at DESC);

-- Consulta de stock por tienda y producto
CREATE INDEX idx_stock_store_product
ON stock_balances(store_id, product_id);

-- Consulta de productos con bajo stock
CREATE INDEX idx_stock_low
ON stock_balances(store_id, product_id, stock);


LOGICA OPERACIONES CRITICAS -----------------------------------------------

5. Lógica de Operaciones Críticas
A. Buscar producto por código de barras

Esta consulta sirve tanto para lector físico como para escaneo por cámara.

SELECT
    p.id,
    p.name,
    pb.barcode,
    p.price,
    p.cost,
    c.name AS category,
    COALESCE(SUM(sb.stock), 0) AS stock_total
FROM product_barcodes pb
JOIN products p ON p.id = pb.product_id
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN stock_balances sb ON sb.product_id = p.id
WHERE pb.business_id = :business_id
  AND pb.barcode = :barcode
  AND p.is_active = true
GROUP BY
    p.id,
    p.name,
    pb.barcode,
    p.price,
    p.cost,
    c.name
LIMIT 1;
B. Registro de venta atómica

Esta operación debe ejecutarse dentro de una transacción desde FastAPI/SQLAlchemy.

Flujo recomendado:

Crear venta en sales.
Validar stock disponible.
Descontar stock en stock_balances.
Insertar detalle en sale_items.
Registrar movimiento en inventory_movements.
Registrar pagos en sale_payments.
Recalcular total en backend.
Confirmar transacción.

Ejemplo simplificado para un producto:

BEGIN;

-- 1. Crear venta
INSERT INTO sales (
    business_id,
    store_id,
    cashier_id,
    status,
    client_generated_id
)
VALUES (
    :business_id,
    :store_id,
    :cashier_id,
    'completed',
    :client_generated_id
)
RETURNING id;

-- 2. Descontar stock solo si hay stock suficiente
WITH updated_stock AS (
    UPDATE stock_balances
    SET
        stock = stock - :quantity,
        updated_at = now()
    WHERE store_id = :store_id
      AND product_id = :product_id
      AND stock >= :quantity
    RETURNING product_id, stock
),
product_data AS (
    SELECT
        p.id,
        p.name,
        p.price,
        p.cost,
        pb.barcode
    FROM products p
    LEFT JOIN product_barcodes pb
        ON pb.product_id = p.id
       AND pb.is_primary = true
    WHERE p.id = :product_id
)
INSERT INTO sale_items (
    sale_id,
    product_id,
    product_name_at_sale,
    barcode_at_sale,
    quantity,
    price_at_sale,
    cost_at_sale,
    discount_amount
)
SELECT
    :sale_id,
    pd.id,
    pd.name,
    pd.barcode,
    :quantity,
    pd.price,
    pd.cost,
    0
FROM product_data pd
JOIN updated_stock us ON us.product_id = pd.id;

-- Si no se insertó ningún sale_item, no había stock suficiente.

-- 3. Registrar movimiento de inventario
INSERT INTO inventory_movements (
    business_id,
    store_id,
    product_id,
    movement_type,
    quantity,
    reference_type,
    reference_id,
    created_by
)
VALUES (
    :business_id,
    :store_id,
    :product_id,
    'sale',
    -:quantity,
    'sale',
    :sale_id,
    :cashier_id
);

-- 4. Registrar pago
INSERT INTO sale_payments (
    sale_id,
    payment_method,
    amount,
    reference_code
)
VALUES (
    :sale_id,
    :payment_method,
    :amount,
    :reference_code
);

-- 5. Actualizar totales de la venta
UPDATE sales
SET
    subtotal = (
        SELECT COALESCE(SUM(price_at_sale * quantity), 0)
        FROM sale_items
        WHERE sale_id = :sale_id
    ),
    discount_total = (
        SELECT COALESCE(SUM(discount_amount), 0)
        FROM sale_items
        WHERE sale_id = :sale_id
    ),
    total_amount = (
        SELECT COALESCE(SUM((price_at_sale * quantity) - discount_amount), 0)
        FROM sale_items
        WHERE sale_id = :sale_id
    )
WHERE id = :sale_id;

COMMIT;
C. Reporte de rentabilidad mensual

Nunca se debe calcular rentabilidad usando el precio o costo actual de products.

Se debe usar siempre:

price_at_sale
cost_at_sale
quantity
SELECT
    SUM((si.price_at_sale - si.cost_at_sale) * si.quantity) AS utilidad_bruta
FROM sale_items si
JOIN sales s ON s.id = si.sale_id
WHERE s.business_id = :business_id
  AND s.status = 'completed'
  AND s.created_at >= :fecha_inicio
  AND s.created_at < :fecha_fin;

Ejemplo:

SELECT
    SUM((si.price_at_sale - si.cost_at_sale) * si.quantity) AS utilidad_bruta
FROM sale_items si
JOIN sales s ON s.id = si.sale_id
WHERE s.business_id = 1
  AND s.status = 'completed'
  AND s.created_at >= '2026-04-01'
  AND s.created_at < '2026-05-01';
D. Productos con bajo stock
SELECT
    p.id,
    p.name,
    s.name AS store,
    sb.stock,
    p.low_stock_threshold,
    c.name AS category
FROM stock_balances sb
JOIN products p ON p.id = sb.product_id
JOIN stores s ON s.id = sb.store_id
LEFT JOIN categories c ON c.id = p.category_id
WHERE sb.stock <= p.low_stock_threshold
  AND p.is_active = true
ORDER BY sb.stock ASC;
E. Ventas recientes
SELECT
    s.id,
    b.name AS business,
    st.name AS store,
    u.name AS cashier,
    s.status,
    s.total_amount,
    s.created_at
FROM sales s
JOIN businesses b ON b.id = s.business_id
JOIN stores st ON st.id = s.store_id
LEFT JOIN users u ON u.id = s.cashier_id
ORDER BY s.created_at DESC
LIMIT 50;
6. Reglas de Integridad

Precios históricos

Nunca calcular ventas pasadas usando el precio actual de products.

Usar siempre:

sale_items.price_at_sale
sale_items.cost_at_sale

Nombre histórico del producto

Guardar el nombre del producto en:

sale_items.product_name_at_sale

Esto permite conservar la historia aunque el producto cambie de nombre o se elimine.

Stock oficial

El stock oficial vive en:

stock_balances

No debe depender solo de cache local, Redis o frontend.

Auditoría de inventario

Todo cambio importante de stock debe generar un registro en:

inventory_movements

Multitenancy

Todas las consultas operativas deben filtrar por:

business_id

Esto evita que un negocio vea datos de otro.

Ventas no se eliminan

Una venta no debería borrarse físicamente. Se debe cambiar su estado a:

cancelled
refunded
partially_refunded

Pagos separados de ventas

Una venta puede tener uno o más pagos.

Ejemplo:

S/ 20 efectivo + S/ 15 Yape

Por eso existe:

sale_payments

Sincronización offline

Para evitar duplicados desde Flutter, cada venta puede tener:

client_generated_id

Este UUID lo genera el cliente y PostgreSQL lo protege con:

UNIQUE (business_id, client_generated_id)
7. Consideraciones para Flutter
Cache local recomendado

En Flutter se puede usar una base local para:

Productos cacheados.
Códigos de barras recientes.
Carrito temporal.
Ventas pendientes de sincronización.
Configuración del lector físico.
Operación offline.

Opciones posibles:

SQLite
Drift
Hive
Isar

La fuente oficial de datos debe seguir siendo PostgreSQL.

8. Consideraciones para Redis

Redis puede usarse en backend para:

Cache de productos por código de barras.
Cache de productos consultados frecuentemente.
Rate limiting.
Sesiones temporales.
Reportes precalculados.
Locks temporales.

Ejemplo de key:

product:business:1:barcode:7751234567890

Redis no debe ser la fuente oficial de stock.

9. Lector físico de código de barras

La base de datos no cambia por usar lector físico.

El lector físico normalmente funciona como teclado: escanea y escribe el código en un input.

Flujo recomendado:

Lector físico
  ↓
Flutter captura barcode
  ↓
FastAPI busca en product_barcodes
  ↓
PostgreSQL devuelve producto
  ↓
Flutter agrega producto al carrito

La cámara puede mantenerse como opción secundaria:

Configuración de escaneo:
- Lector físico
- Cámara
- Ambos
10. Recomendación de Arquitectura General
Flutter App / Flutter Web
        |
        | REST API / JWT
        v
FastAPI + SQLAlchemy / SQLModel
        |
        v
PostgreSQL
        |
        + Redis opcional para cache backend
        + SQLite/Hive/Isar opcional para cache local/offline
11. Resumen de Mejoras frente al Modelo Inicial

El modelo inicial tenía:

sellers
products
sales
sale_items

El modelo recomendado separa mejor las responsabilidades:

businesses
users
stores
categories
products
product_barcodes
stock_balances
sales
sale_items
sale_payments
inventory_movements

Principales mejoras:

Separación entre negocio, usuario y tienda.
Soporte para varios usuarios por negocio.
Soporte para varias sucursales.
Soporte para múltiples códigos de barras por producto.
Stock por tienda.
Historial de movimientos de inventario.
Pagos múltiples por venta.
Estados de venta.
Soporte para ventas offline mediante client_generated_id.
Mejor base para reportes y auditoría.