"""Models package — VentaFácil Backend"""
from app.database import Base
from app.models.core import Business, Store, User, AppSetting
from app.models.product import Category, Product, ProductBarcode
from app.models.inventory import StockBalance, InventoryMovement
from app.models.sales import Sale, SaleItem, SalePayment
from app.models.barcode import ExternalProductCache

# This allows Alembic to discover all models by importing `from app.models import Base`
__all__ = [
    "Base",
    "Business",
    "Store",
    "User",
    "AppSetting",
    "Category",
    "Product",
    "ProductBarcode",
    "ExternalProductCache",
    "StockBalance",
    "InventoryMovement",
    "Sale",
    "SaleItem",
    "SalePayment",
]

