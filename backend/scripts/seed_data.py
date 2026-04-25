import asyncio
import os
import sys

# Ensure we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.config import settings
from app.models.core import Business, Store, User, AppSetting
from app.models.product import Category, Product, ProductBarcode
from app.models.inventory import StockBalance
from app.models.sales import Sale

async def seed_data():
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as session:
        print("Creating demo business and store...")
        business = Business(name="Mi Tiendita", tax_id="DEMO1234")
        session.add(business)
        await session.flush()

        store = Store(business_id=business.id, name="Sucursal Principal", address="Av. Central 123")
        session.add(store)

        user = User(business_id=business.id, username="admin", role="admin")
        session.add(user)

        print("Creating categories...")
        cat_bebidas = Category(business_id=business.id, name="Bebidas")
        cat_snacks = Category(business_id=business.id, name="Snacks")
        session.add_all([cat_bebidas, cat_snacks])
        await session.flush()

        print("Creating products...")
        coca_cola = Product(
            business_id=business.id, category_id=cat_bebidas.id,
            name="Coca Cola 600ml", price=18.0, cost=12.0
        )
        sabritas = Product(
            business_id=business.id, category_id=cat_snacks.id,
            name="Sabritas Original", price=15.0, cost=10.0
        )
        session.add_all([coca_cola, sabritas])
        await session.flush()

        print("Creating barcodes...")
        barcode1 = ProductBarcode(business_id=business.id, product_id=coca_cola.id, barcode="7501055300075", is_primary=True)
        barcode2 = ProductBarcode(business_id=business.id, product_id=sabritas.id, barcode="7501011167586", is_primary=True)
        session.add_all([barcode1, barcode2])

        print("Creating initial stock...")
        stock1 = StockBalance(store_id=store.id, product_id=coca_cola.id, stock=50)
        stock2 = StockBalance(store_id=store.id, product_id=sabritas.id, stock=30)
        session.add_all([stock1, stock2])

        print("Adding default settings...")
        setting = AppSetting(business_id=business.id, setting_key="display_mode", setting_value="auto")
        session.add(setting)

        await session.commit()
        print("Seed data applied successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
