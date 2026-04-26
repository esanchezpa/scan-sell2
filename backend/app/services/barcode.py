from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.product import Product, ProductBarcode, Category
from app.models.barcode import ExternalProductCache
from app.models.inventory import StockBalance
from app.schemas.barcode import BarcodeLookupResponse


CATEGORY_MAP = {
    "bebidas": "Bebidas",
    "beverages": "Bebidas",
    "snacks": "Snacks",
    "abarrotes": "Abarrotes",
    "groceries": "Abarrotes",
    "limpieza": "Limpieza",
    "cleaning": "Limpieza",
    "cuidado personal": "Cuidado Personal",
    "personal care": "Cuidado Personal",
}


class BarcodeService:
    @staticmethod
    async def lookup(db: AsyncSession, business_id: int, barcode: str) -> BarcodeLookupResponse:
        internal_result = await BarcodeService._lookup_internal(db, business_id, barcode)
        if internal_result:
            return internal_result

        cache_result = await BarcodeService._lookup_cache(db, barcode)
        if cache_result:
            return cache_result

        off_result = await BarcodeService._lookup_openfoodfacts(db, barcode)
        return off_result

    @staticmethod
    async def get_internal_product_by_barcode(db: AsyncSession, business_id: int, barcode: str) -> Optional[Product]:
        query = (
            select(Product)
            .join(ProductBarcode, Product.id == ProductBarcode.product_id)
            .where(
                ProductBarcode.barcode == barcode,
                Product.business_id == business_id,
            )
            .options(selectinload(Product.barcodes))
        )
        result = await db.execute(query)
        product = result.scalars().first()

        if not product:
            return None

        stock_query = select(
            func.coalesce(func.sum(StockBalance.stock), 0)
        ).where(StockBalance.product_id == product.id)
        stock_result = await db.execute(stock_query)
        stock_qty = stock_result.scalar() or 0
        object.__setattr__(product, 'stock_quantity', stock_qty)

        if product.category_id:
            cat_query = select(Category.name).where(Category.id == product.category_id)
            cat_result = await db.execute(cat_query)
            cat_name = cat_result.scalar()
            object.__setattr__(product, 'category_name', cat_name)

        return product

    @staticmethod
    async def _lookup_internal(db: AsyncSession, business_id: int, barcode: str) -> Optional[BarcodeLookupResponse]:
        product = await BarcodeService.get_internal_product_by_barcode(db, business_id, barcode)

        if not product:
            return None

        status = "active" if product.is_active else "inactive"

        return BarcodeLookupResponse(
            found=True,
            source="internal",
            status=status,
            barcode=barcode,
            product_id=product.id,
            name=product.name,
            brand=None,
            image_url=product.image_url,
            category_id=product.category_id,
            category_name=getattr(product, 'category_name', None),
            price=product.price,
            cost=product.cost,
            stock_quantity=getattr(product, 'stock_quantity', 0),
            low_stock_threshold=product.low_stock_threshold,
            description=product.description,
        )

    @staticmethod
    async def _lookup_cache(db: AsyncSession, barcode: str) -> Optional[BarcodeLookupResponse]:
        query = select(ExternalProductCache).where(ExternalProductCache.barcode == barcode)
        result = await db.execute(query)
        cache_entry = result.scalars().first()

        if not cache_entry:
            return None

        if cache_entry.expires_at <= datetime.now(timezone.utc):
            return None

        return BarcodeLookupResponse(
            found=True,
            source="cache",
            status="external_suggestion",
            barcode=barcode,
            product_id=None,
            name=cache_entry.product_name,
            brand=cache_entry.brand,
            image_url=cache_entry.image_url,
            category_name=cache_entry.category_name,
            price=None,
            cost=None,
            stock_quantity=None,
        )

    @staticmethod
    async def _lookup_openfoodfacts(db: AsyncSession, barcode: str) -> BarcodeLookupResponse:
        import httpx

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"https://world.openfoodfacts.org/api/v2/product/{barcode}.json"
                )

            if response.status_code != 200:
                return BarcodeLookupResponse(found=False, source="none", status="not_found", barcode=barcode)

            data = response.json()

            if data.get("status") != 1 or not data.get("product"):
                return BarcodeLookupResponse(found=False, source="none", status="not_found", barcode=barcode)

            product = data["product"]

            off_name = product.get("product_name") or product.get("product_name_es") or product.get("generic_name")
            brand = product.get("brands")

            image_url = None
            candidates = [
                product.get("image_url"),
                product.get("front_image_url"),
                product.get("selected_images", {}).get("front", {}).get("display", {}).get("es"),
                product.get("selected_images", {}).get("front", {}).get("display", {}).get("en"),
            ]
            for candidate in candidates:
                if isinstance(candidate, str) and candidate.startswith("http") and "/" in candidate:
                    image_url = candidate
                    break

            category_name = None
            categories_tags = product.get("categories_tags") or []
            if isinstance(categories_tags, list):
                for tag in categories_tags:
                    tag_lower = tag.lower()
                    for key, value in CATEGORY_MAP.items():
                        if key in tag_lower:
                            category_name = value
                            break
                    if category_name:
                        break

            now = datetime.now(timezone.utc)
            expires_at = now + timedelta(days=30)

            cache_query = select(ExternalProductCache).where(ExternalProductCache.barcode == barcode)
            cache_result = await db.execute(cache_query)
            existing = cache_result.scalars().first()

            if existing:
                existing.source = "openfoodfacts"
                existing.product_name = off_name
                existing.brand = brand
                existing.image_url = image_url
                existing.category_name = category_name
                existing.raw_response = product
                existing.last_fetched_at = now
                existing.expires_at = expires_at
            else:
                new_cache = ExternalProductCache(
                    barcode=barcode,
                    source="openfoodfacts",
                    product_name=off_name,
                    brand=brand,
                    image_url=image_url,
                    category_name=category_name,
                    raw_response=product,
                    last_fetched_at=now,
                    expires_at=expires_at,
                )
                db.add(new_cache)

            await db.commit()

            return BarcodeLookupResponse(
                found=True,
                source="openfoodfacts",
                status="external_suggestion",
                barcode=barcode,
                product_id=None,
                name=off_name,
                brand=brand,
                image_url=image_url,
                category_name=category_name,
                price=None,
                cost=None,
                stock_quantity=None,
            )

        except Exception:
            return BarcodeLookupResponse(found=False, source="none", status="not_found", barcode=barcode)
