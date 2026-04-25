from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.product import Product, ProductBarcode, Category
from app.schemas.products import ProductCreate, ProductUpdate, ProductBarcodeCreate


class ProductService:
    @staticmethod
    async def get_all_products(session: AsyncSession, business_id: int) -> List[Product]:
        query = select(Product).where(Product.business_id == business_id, Product.is_active == True)
        result = await session.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_product_by_id(session: AsyncSession, product_id: int) -> Optional[Product]:
        query = select(Product).where(Product.id == product_id)
        result = await session.execute(query)
        return result.scalars().first()

    @staticmethod
    async def get_product_by_barcode(session: AsyncSession, business_id: int, barcode: str) -> Optional[Product]:
        query = (
            select(Product)
            .join(ProductBarcode, Product.id == ProductBarcode.product_id)
            .where(
                ProductBarcode.barcode == barcode,
                Product.business_id == business_id,
                Product.is_active == True
            )
        )
        result = await session.execute(query)
        return result.scalars().first()

    @staticmethod
    async def create_product(session: AsyncSession, product_in: ProductCreate) -> Product:
        product_data = product_in.model_dump(exclude={"barcode"})
        db_product = Product(**product_data)
        session.add(db_product)
        await session.flush() # To get the product ID

        if product_in.barcode:
            barcode = ProductBarcode(
                business_id=product_in.business_id,
                product_id=db_product.id,
                barcode=product_in.barcode,
                is_primary=True
            )
            session.add(barcode)
        
        await session.commit()
        await session.refresh(db_product)
        return db_product

    @staticmethod
    async def get_categories(session: AsyncSession, business_id: int) -> List[Category]:
        query = select(Category).where(Category.business_id == business_id)
        result = await session.execute(query)
        return list(result.scalars().all())
