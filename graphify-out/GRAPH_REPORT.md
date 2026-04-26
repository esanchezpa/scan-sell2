# Graph Report - .  (2026-04-26)

## Corpus Check
- 126 files · ~123,085 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 345 nodes · 456 edges · 17 communities detected
- Extraction: 74% EXTRACTED · 25% INFERRED · 0% AMBIGUOUS · INFERRED: 116 edges (avg confidence: 0.64)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Barcode API Contracts|Barcode API Contracts]]
- [[_COMMUNITY_Backend Domain Models|Backend Domain Models]]
- [[_COMMUNITY_Schemas And Inventory|Schemas And Inventory]]
- [[_COMMUNITY_Sales Dialog Interactions|Sales Dialog Interactions]]
- [[_COMMUNITY_Product Service API|Product Service API]]
- [[_COMMUNITY_System Architecture Risks|System Architecture Risks]]
- [[_COMMUNITY_Barcode Service Logic|Barcode Service Logic]]
- [[_COMMUNITY_Settings Schemas|Settings Schemas]]
- [[_COMMUNITY_Product Dialog Flow|Product Dialog Flow]]
- [[_COMMUNITY_Alembic Migration Runtime|Alembic Migration Runtime]]
- [[_COMMUNITY_Backend Configuration|Backend Configuration]]
- [[_COMMUNITY_Root Barcode Listener|Root Barcode Listener]]
- [[_COMMUNITY_Database Session|Database Session]]
- [[_COMMUNITY_Initial Database Migration|Initial Database Migration]]
- [[_COMMUNITY_Health Router|Health Router]]
- [[_COMMUNITY_Reset|Reset]]
- [[_COMMUNITY_Reports|Reports]]

## God Nodes (most connected - your core abstractions)
1. `Base` - 17 edges
2. `Services package — VentaFácil Backend` - 17 edges
3. `StockBalance` - 15 edges
4. `InventoryMovement` - 11 edges
5. `ProductService` - 11 edges
6. `Category` - 10 edges
7. `FastAPI Main App` - 9 edges
8. `ProductService` - 9 edges
9. `BarcodeService` - 9 edges
10. `Product` - 8 edges

## Surprising Connections (you probably didn't know these)
- `README Flutter Drift` --conceptually_related_to--> `Frontend React TanStack`  [INFERRED]
  README.md → src/routes/__root.tsx
- `VentaFacil POS Architecture` --conceptually_related_to--> `Backend FastAPI Async`  [EXTRACTED]
  claude.md → backend/app/main.py
- `VentaFacil POS Architecture` --conceptually_related_to--> `Static Product Images`  [EXTRACTED]
  claude.md → backend/app/main.py
- `VentaFacil POS Architecture` --conceptually_related_to--> `Environment Configuration`  [EXTRACTED]
  claude.md → backend/app/config.py
- `Root Frontend Scripts` --references--> `Frontend React TanStack`  [EXTRACTED]
  package.json → src/routes/__root.tsx

## Hyperedges (group relationships)
- **Product Reactivation Core Flow** — claude_barcode_lookup_endpoint, claude_product_dialog, claude_product_reactivate_endpoint, claude_product_service, claude_stock_balance_model, claude_inventory_movement_model [EXTRACTED 1.00]
- **Sale Inventory Core Flow** — claude_new_sale_dialog, claude_sales_create_endpoint, claude_sales_service, claude_stock_balance_model, claude_inventory_movement_model [EXTRACTED 1.00]
- **Frontend Backend Contract Mapping** — claude_api_client, claude_zustand_store, claude_backend_contract_mapping, claude_barcode_lookup_endpoint, claude_product_reactivate_endpoint [EXTRACTED 1.00]

## Communities

### Community 0 - "Barcode API Contracts"
Cohesion: 0.07
Nodes (48): Frontend API Client, Frontend API Endpoint Drift, Snake to Camel Mapping, GET /barcode/lookup, Barcode Lookup Flow, Barcode Router, BarcodeScanner Camera, BarcodeService (+40 more)

### Community 1 - "Backend Domain Models"
Cohesion: 0.12
Nodes (30): BarcodeService, ExternalProductCache, Base, AppSetting, Business, New table for global or store settings (like display mode)., Store, User (+22 more)

### Community 2 - "Schemas And Inventory"
Cohesion: 0.14
Nodes (22): BaseModel, InventoryMovementBase, InventoryMovementCreate, InventoryMovementResponse, StockBalanceResponse, BarcodeExistsResponse, CategoryBase, CategoryCreate (+14 more)

### Community 3 - "Sales Dialog Interactions"
Cohesion: 0.15
Nodes (11): handleCatalogScan(), onEdit(), addItem(), addProductToCart(), complete(), formatPEN(), handleSearchKeyDown(), lookupBarcode() (+3 more)

### Community 4 - "Product Service API"
Cohesion: 0.24
Nodes (14): barcode_exists(), create_product(), delete_product(), get_all_products(), get_barcode_info(), get_categories(), get_product(), get_product_by_barcode() (+6 more)

### Community 5 - "System Architecture Risks"
Cohesion: 0.12
Nodes (17): Backend FastAPI Async, Catalog Route, Database Constraints Gap, Encoding Mojibake Risk, Environment Configuration, Frontend React TanStack, Inventory Route, PostgreSQL Source of Truth (+9 more)

### Community 6 - "Barcode Service Logic"
Cohesion: 0.23
Nodes (11): BarcodeLookupResponse, _extract_category(), _extract_image_url(), get_internal_product_by_barcode(), lookup(), lookup_barcode(), _lookup_cache(), _lookup_internal() (+3 more)

### Community 7 - "Settings Schemas"
Cohesion: 0.29
Nodes (7): AppSettingBase, AppSettingCreate, AppSettingResponse, AppSettingUpdate, get_setting(), set_setting(), SettingsService

### Community 8 - "Product Dialog Flow"
Cohesion: 0.33
Nodes (8): doSubmit(), handleBarcodeBlur(), handleBarcodeKeyDown(), lookupBarcodeInfo(), onAi(), reset(), setBarcode(), submit()

### Community 9 - "Alembic Migration Runtime"
Cohesion: 0.31
Nodes (7): get_url(), Run migrations in 'offline' mode.      This configures the context with just a U, In this scenario we need to create an Engine     and associate a connection with, Run migrations in 'online' mode., run_async_migrations(), run_migrations_offline(), run_migrations_online()

### Community 10 - "Backend Configuration"
Cohesion: 0.4
Nodes (4): BaseSettings, get_settings(), VentaFácil — Application Configuration Reads environment variables from .env via, Settings

### Community 13 - "Root Barcode Listener"
Cohesion: 0.33
Nodes (2): RootComponent(), useGlobalBarcodeListener()

### Community 14 - "Database Session"
Cohesion: 0.4
Nodes (3): check_db_connection(), VentaFácil — SQLAlchemy Database Session, Verify database connectivity at startup.

### Community 15 - "Initial Database Migration"
Cohesion: 0.5
Nodes (1): Initial migration  Revision ID: 62ea25842e8a Revises:  Create Date: 2026-04-24 2

### Community 19 - "Health Router"
Cohesion: 0.67
Nodes (1): VentaFácil — Health Check Router GET /health

### Community 20 - "Reset"
Cohesion: 1.0
Nodes (2): reset(), save()

### Community 22 - "Reports"
Cohesion: 1.0
Nodes (1): Placeholder router — will be implemented in Fase 2.

## Ambiguous Edges - Review These
- `Inventory Router` → `Frontend API Endpoint Drift`  [AMBIGUOUS]
  src/lib/api.ts · relation: conceptually_related_to

## Knowledge Gaps
- **31 isolated node(s):** `Run migrations in 'offline' mode.      This configures the context with just a U`, `In this scenario we need to create an Engine     and associate a connection with`, `Run migrations in 'online' mode.`, `Initial migration  Revision ID: 62ea25842e8a Revises:  Create Date: 2026-04-24 2`, `VentaFácil — Application Configuration Reads environment variables from .env via` (+26 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Root Barcode Listener`** (6 nodes): `NotFoundComponent()`, `RootComponent()`, `RootShell()`, `useGlobalBarcode.ts`, `__root.tsx`, `useGlobalBarcodeListener()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Initial Database Migration`** (4 nodes): `downgrade()`, `Initial migration  Revision ID: 62ea25842e8a Revises:  Create Date: 2026-04-24 2`, `upgrade()`, `62ea25842e8a_initial_migration.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Health Router`** (3 nodes): `health.py`, `health_check()`, `VentaFácil — Health Check Router GET /health`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Reset`** (3 nodes): `reset()`, `save()`, `customers.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Reports`** (2 nodes): `reports.py`, `Placeholder router — will be implemented in Fase 2.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Inventory Router` and `Frontend API Endpoint Drift`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `lookup()` connect `Barcode Service Logic` to `Product Dialog Flow`, `Sales Dialog Interactions`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `BarcodeService` connect `Backend Domain Models` to `Barcode Service Logic`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `StockBalance` connect `Backend Domain Models` to `Product Service API`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Are the 15 inferred relationships involving `Base` (e.g. with `ExternalProductCache` and `Business`) actually correct?**
  _`Base` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `Services package — VentaFácil Backend` (e.g. with `Base` and `Business`) actually correct?**
  _`Services package — VentaFácil Backend` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 13 inferred relationships involving `StockBalance` (e.g. with `Base` and `Services package — VentaFácil Backend`) actually correct?**
  _`StockBalance` has 13 INFERRED edges - model-reasoned connections that need verification._