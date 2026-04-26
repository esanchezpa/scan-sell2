from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import selectinload

from app.models.product import Product, ProductBarcode, Category
from app.schemas.products import ProductCreate, ProductUpdate, ProductResponse, ProductBarcodeResponse
from app.models.inventory import StockBalance, InventoryMovement
from app.models.core import Store


class ProductService:
    @staticmethod
    def _normalize_image_url(image_url: Optional[str]) -> Optional[str]:
        if not image_url:
            return image_url
        if image_url.startswith("http://localhost:8000"):
            image_url = image_url.replace("http://localhost:8000", "")
        if not (
            image_url.startswith("/images/")
            or image_url.startswith("http://")
            or image_url.startswith("https://")
        ):
            return None
        return image_url

    @staticmethod
    async def _resolve_category(
        session: AsyncSession,
        business_id: int,
        category_name: Optional[str] = None,
        category_id: Optional[int] = None,
    ) -> tuple[Optional[int], Optional[str]]:
        if category_name:
            cat_query = select(Category).where(
                Category.business_id == business_id,
                Category.name == category_name,
            )
            cat_result = await session.execute(cat_query)
            db_category = cat_result.scalars().first()
            if not db_category:
                db_category = Category(business_id=business_id, name=category_name)
                session.add(db_category)
                await session.flush()
            return db_category.id, db_category.name

        if category_id is not None:
            cat_query = select(Category).where(
                Category.id == category_id,
                Category.business_id == business_id,
            )
            cat_result = await session.execute(cat_query)
            db_category = cat_result.scalars().first()
            if not db_category:
                raise ValueError("CATEGORY_NOT_FOUND")
            return db_category.id, db_category.name

        return None, None

    @staticmethod
    async def _get_default_store(session: AsyncSession, business_id: int) -> Optional[Store]:
        store_query = select(Store).where(Store.business_id == business_id).limit(1)
        store_result = await session.execute(store_query)
        return store_result.scalars().first()

    @staticmethod
    async def _set_stock_balance(
        session: AsyncSession,
        *,
        store_id: int,
        product_id: int,
        stock: int,
    ) -> None:
        insert_stmt = pg_insert(StockBalance).values(
            store_id=store_id,
            product_id=product_id,
            stock=stock,
        )
        excluded = insert_stmt.excluded
        upsert_stmt = insert_stmt.on_conflict_do_update(
            index_elements=[
                StockBalance.__table__.c.store_id,
                StockBalance.__table__.c.product_id,
            ],
            set_={
                "stock": excluded.stock,
                "updated_at": func.now(),
            },
        )
        await session.execute(upsert_stmt)

    @staticmethod
    def _build_product_response(
        product: Product,
        *,
        barcodes: Optional[List[ProductBarcode]] = None,
        category_name: Optional[str] = None,
        stock_quantity: Optional[int] = None,
    ) -> ProductResponse:
        barcode_models = [
            ProductBarcodeResponse.model_validate(barcode)
            for barcode in (barcodes if barcodes is not None else list(product.barcodes or []))
        ]
        return ProductResponse(
            id=product.id,
            business_id=product.business_id,
            name=product.name,
            description=product.description,
            price=float(product.price),
            cost=float(product.cost),
            low_stock_threshold=product.low_stock_threshold,
            image_url=product.image_url,
            is_active=product.is_active,
            category_id=product.category_id,
            created_at=product.created_at,
            updated_at=product.updated_at,
            barcodes=barcode_models,
            category_name=category_name,
            stock_quantity=stock_quantity,
        )

    @staticmethod
    async def get_all_products(session: AsyncSession, business_id: int) -> List[Product]:
        query = (
            select(Product)
            .where(Product.business_id == business_id, Product.is_active == True)
            .options(selectinload(Product.barcodes))
        )
        result = await session.execute(query)
        products = list(result.scalars().all())

        if not products:
            return products

        product_ids = [p.id for p in products]
        stock_query = select(
            StockBalance.product_id,
            func.coalesce(func.sum(StockBalance.stock), 0).label("total_stock")
        ).where(StockBalance.product_id.in_(product_ids)).group_by(StockBalance.product_id)
        stock_result = await session.execute(stock_query)
        stock_map = {row.product_id: row.total_stock for row in stock_result}

        category_ids = [p.category_id for p in products if p.category_id]
        if category_ids:
            cat_query = select(Category.id, Category.name).where(Category.id.in_(category_ids))
            cat_result = await session.execute(cat_query)
            category_map = {row.id: row.name for row in cat_result}
        else:
            category_map = {}

        for p in products:
            p.stock_quantity = stock_map.get(p.id, 0)
            if p.category_id:
                p.category_name = category_map.get(p.category_id)

        return products

    @staticmethod
    async def get_product_by_id(session: AsyncSession, product_id: int) -> Optional[Product]:
        query = (
            select(Product)
            .where(Product.id == product_id)
            .options(selectinload(Product.barcodes))
        )
        result = await session.execute(query)
        product = result.scalars().first()
        if product:
            stock_query = select(func.coalesce(func.sum(StockBalance.stock), 0)).where(StockBalance.product_id == product.id)
            stock_res = await session.execute(stock_query)
            object.__setattr__(product, 'stock_quantity', stock_res.scalar() or 0)
            if product.category_id:
                cat_query = select(Category.name).where(Category.id == product.category_id)
                cat_res = await session.execute(cat_query)
                object.__setattr__(product, 'category_name', cat_res.scalar())
        return product

    @staticmethod
    async def update_product(session: AsyncSession, product_id: int, product_in: ProductUpdate) -> Optional[Product]:
        product = await ProductService.get_product_by_id(session, product_id)
        if not product:
            return None

        update_data = product_in.model_dump(exclude_unset=True, exclude={"category", "stock"})
        if hasattr(product_in, 'category') and product_in.category:
            category_id, _ = await ProductService._resolve_category(
                session,
                product.business_id,
                category_name=product_in.category,
            )
            update_data["category_id"] = category_id
        if "image_url" in update_data:
            update_data["image_url"] = ProductService._normalize_image_url(update_data["image_url"])
        for field, value in update_data.items():
            setattr(product, field, value)

        if product_in.stock is not None:
            store = await ProductService._get_default_store(session, product.business_id)
            if store:
                await ProductService._set_stock_balance(
                    session,
                    store_id=store.id,
                    product_id=product_id,
                    stock=product_in.stock,
                )

        session.add(product)
        await session.commit()
        return await ProductService.get_product_by_id(session, product_id)

    @staticmethod
    async def barcode_exists(session: AsyncSession, business_id: int, barcode: str) -> bool:
        query = select(ProductBarcode).where(
            ProductBarcode.business_id == business_id,
            ProductBarcode.barcode == barcode
        )
        result = await session.execute(query)
        return result.scalars().first() is not None

    @staticmethod
    async def get_barcode_info(session: AsyncSession, business_id: int, barcode: str) -> dict:
        query = (
            select(ProductBarcode, Product)
            .join(Product, Product.id == ProductBarcode.product_id)
            .where(ProductBarcode.barcode == barcode, Product.business_id == business_id)
        )
        result = await session.execute(query)
        row = result.first()
        if not row:
            return {"exists": False, "is_deleted": False, "product_id": None, "product": None}
        pb, product = row
        return {
            "exists": True,
            "is_deleted": not product.is_active,
            "product_id": product.id,
            "product": product
        }

    @staticmethod
    async def reactivate_product(session: AsyncSession, product_id: int) -> Optional[Product]:
        product = await ProductService.get_product_by_id(session, product_id)
        if not product:
            return None
        product.is_active = True
        session.add(product)
        await session.commit()
        return await ProductService.get_product_by_id(session, product_id)

    @staticmethod
    async def reactivate_and_update(
        session: AsyncSession,
        product_id: int,
        business_id: int,
        store_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        category: Optional[str] = None,
        category_id: Optional[int] = None,
        price: Optional[float] = None,
        cost: Optional[float] = None,
        image_url: Optional[str] = None,
        low_stock_threshold: Optional[int] = None,
        stock_quantity: Optional[int] = None,
    ) -> Optional[ProductResponse]:
        query = (
            select(Product)
            .where(Product.id == product_id)
            .options(selectinload(Product.barcodes))
        )
        result = await session.execute(query)
        product = result.scalars().first()
        if not product:
            return None
        if product.business_id != business_id:
            raise ValueError("PRODUCT_BUSINESS_MISMATCH")

        store_query = select(Store).where(
            Store.id == store_id,
            Store.business_id == business_id
        )
        store_result = await session.execute(store_query)
        store = store_result.scalars().first()
        if not store:
            raise ValueError("STORE_NOT_FOUND")

        product.is_active = True
        resolved_category_name = None

        if name is not None:
            product.name = name
        if description is not None:
            product.description = description
        if category is not None:
            resolved_category_id, resolved_category_name = await ProductService._resolve_category(
                session,
                product.business_id,
                category_name=category,
            )
            product.category_id = resolved_category_id
        elif category_id is not None:
            resolved_category_id, resolved_category_name = await ProductService._resolve_category(
                session,
                business_id,
                category_id=category_id,
            )
            product.category_id = resolved_category_id
        elif product.category_id is not None:
            cat_query = select(Category.name).where(Category.id == product.category_id)
            cat_result = await session.execute(cat_query)
            resolved_category_name = cat_result.scalar()
        if price is not None:
            product.price = price
        if cost is not None:
            product.cost = cost
        if image_url is not None:
            product.image_url = ProductService._normalize_image_url(image_url)
        if low_stock_threshold is not None:
            product.low_stock_threshold = low_stock_threshold

        session.add(product)
        await session.flush()

        if stock_quantity is not None:
            await ProductService._set_stock_balance(
                session,
                store_id=store_id,
                product_id=product_id,
                stock=stock_quantity,
            )
            movement = InventoryMovement(
                business_id=business_id,
                store_id=store_id,
                product_id=product_id,
                movement_type="adjustment",
                quantity=stock_quantity,
                reference_type="product_reactivation",
            )
            session.add(movement)

        await session.commit()
        await session.refresh(product)
        return ProductService._build_product_response(
            product,
            category_name=resolved_category_name,
            stock_quantity=stock_quantity if stock_quantity is not None else 0,
        )

    @staticmethod
    async def get_product_by_barcode(session: AsyncSession, business_id: int, barcode: str) -> Optional[Product]:
        from app.services.barcode import BarcodeService
        return await BarcodeService.get_internal_product_by_barcode(session, business_id, barcode)

    @staticmethod
    async def create_product(session: AsyncSession, product_in: ProductCreate) -> ProductResponse:
        if product_in.barcode:
            barcode_info = await ProductService.get_barcode_info(session, product_in.business_id, product_in.barcode)
            if barcode_info["exists"]:
                if barcode_info["is_deleted"]:
                    raise ValueError(f"PRODUCT_INACTIVE_EXISTS:{barcode_info['product_id']}")
                else:
                    raise ValueError("PRODUCT_ALREADY_EXISTS")

        product_data = product_in.model_dump(exclude={"barcode", "category", "stock"})
        resolved_category_name = None
        if product_in.category:
            category_id, resolved_category_name = await ProductService._resolve_category(
                session,
                product_in.business_id,
                category_name=product_in.category,
            )
            product_data["category_id"] = category_id
        elif product_in.category_id is not None:
            category_id, resolved_category_name = await ProductService._resolve_category(
                session,
                product_in.business_id,
                category_id=product_in.category_id,
            )
            product_data["category_id"] = category_id

        if product_data.get("image_url"):
            product_data["image_url"] = ProductService._normalize_image_url(product_data["image_url"])
        db_product = Product(**product_data)
        session.add(db_product)
        await session.flush()

        barcode_record: Optional[ProductBarcode] = None
        if product_in.barcode:
            barcode_record = ProductBarcode(
                business_id=product_in.business_id,
                product_id=db_product.id,
                barcode=product_in.barcode,
                is_primary=True
            )
            session.add(barcode_record)

        stock_quantity = product_in.stock if product_in.stock is not None else 0
        if product_in.stock is not None and product_in.stock > 0:
            store = await ProductService._get_default_store(session, product_in.business_id)
            if store:
                await ProductService._set_stock_balance(
                    session,
                    store_id=store.id,
                    product_id=db_product.id,
                    stock=product_in.stock,
                )

        await session.flush()
        await session.commit()
        await session.refresh(db_product)
        return ProductService._build_product_response(
            db_product,
            barcodes=[barcode_record] if barcode_record else [],
            category_name=resolved_category_name,
            stock_quantity=stock_quantity,
        )

    @staticmethod
    async def delete_product(session: AsyncSession, product_id: int) -> bool:
        product = await ProductService.get_product_by_id(session, product_id)
        if not product:
            return False
        product.is_active = False
        session.add(product)
        await session.commit()
        return True

    @staticmethod
    async def get_categories(session: AsyncSession, business_id: int) -> List[Category]:
        query = select(Category).where(Category.business_id == business_id)
        result = await session.execute(query)
        return list(result.scalars().all())
