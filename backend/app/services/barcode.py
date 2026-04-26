from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.barcode import ExternalProductCache
from app.models.inventory import StockBalance
from app.models.product import Category, Product, ProductBarcode
from app.schemas.barcode import BarcodeLookupResponse


CATEGORY_MAP = {
    "bebidas": "Bebidas",
    "beverages": "Bebidas",
    "drinks": "Bebidas",
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
    async def lookup(
        session: AsyncSession,
        business_id: int,
        store_id: int,
        barcode: str,
    ) -> BarcodeLookupResponse:
        internal_result = await BarcodeService._lookup_internal(
            session,
            business_id,
            store_id,
            barcode,
        )
        if internal_result:
            return internal_result

        cache_result = await BarcodeService._lookup_cache(session, barcode)
        if cache_result:
            return cache_result

        return await BarcodeService._lookup_openfoodfacts(session, barcode)

    @staticmethod
    async def get_internal_product_by_barcode(
        session: AsyncSession,
        business_id: int,
        barcode: str,
    ) -> Optional[Product]:
        query = (
            select(Product)
            .join(ProductBarcode, Product.id == ProductBarcode.product_id)
            .where(
                ProductBarcode.business_id == business_id,
                ProductBarcode.barcode == barcode,
                Product.business_id == business_id,
                Product.is_active == True,
            )
        )
        result = await session.execute(query)
        return result.scalars().first()

    @staticmethod
    async def _lookup_internal(
        session: AsyncSession,
        business_id: int,
        store_id: int,
        barcode: str,
    ) -> Optional[BarcodeLookupResponse]:
        stock_quantity = (
            select(func.coalesce(func.sum(StockBalance.stock), 0))
            .where(
                StockBalance.store_id == store_id,
                StockBalance.product_id == Product.id,
            )
            .correlate(Product)
            .scalar_subquery()
        )
        query = (
            select(
                Product,
                ProductBarcode.barcode.label("barcode"),
                Category.id.label("category_id"),
                Category.name.label("category_name"),
                stock_quantity.label("stock_quantity"),
            )
            .join(ProductBarcode, Product.id == ProductBarcode.product_id)
            .outerjoin(
                Category,
                and_(
                    Category.id == Product.category_id,
                    Category.business_id == Product.business_id,
                ),
            )
            .where(
                ProductBarcode.business_id == business_id,
                ProductBarcode.barcode == barcode,
                Product.business_id == business_id,
            )
        )
        result = await session.execute(query)
        row = result.first()
        if not row:
            return None

        product = row.Product
        return BarcodeLookupResponse(
            found=True,
            source="internal",
            status="active" if product.is_active else "inactive",
            barcode=row.barcode,
            product_id=product.id,
            name=product.name,
            brand=None,
            image_url=product.image_url,
            category_id=row.category_id,
            category_name=row.category_name,
            price=product.price,
            cost=product.cost,
            stock_quantity=row.stock_quantity,
            low_stock_threshold=product.low_stock_threshold,
            description=product.description,
        )

    @staticmethod
    async def _lookup_cache(session: AsyncSession, barcode: str) -> Optional[BarcodeLookupResponse]:
        query = select(ExternalProductCache).where(ExternalProductCache.barcode == barcode)
        result = await session.execute(query)
        cache_entry = result.scalars().first()
        if not cache_entry:
            return None

        expires_at = cache_entry.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at <= datetime.now(timezone.utc):
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
            category_id=None,
            category_name=cache_entry.category_name,
            price=None,
            cost=None,
            stock_quantity=None,
            low_stock_threshold=None,
            description=None,
        )

    @staticmethod
    async def _lookup_openfoodfacts(session: AsyncSession, barcode: str) -> BarcodeLookupResponse:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"https://world.openfoodfacts.org/api/v2/product/{barcode}.json"
                )
            if response.status_code != 200:
                return BarcodeLookupResponse(found=False, source="none", status="not_found", barcode=barcode)

            data = response.json()
            product = data.get("product")
            if data.get("status") != 1 or not product:
                return BarcodeLookupResponse(found=False, source="none", status="not_found", barcode=barcode)

            off_name = product.get("product_name") or product.get("product_name_es") or product.get("generic_name")
            brand = product.get("brands")
            image_url = BarcodeService._extract_image_url(product)
            category_name = BarcodeService._extract_category(product.get("categories_tags") or [])

            await BarcodeService._upsert_cache(
                session,
                barcode,
                {
                    "product_name": off_name,
                    "brand": brand,
                    "image_url": image_url,
                    "category_name": category_name,
                    "raw_response": product,
                },
            )

            return BarcodeLookupResponse(
                found=True,
                source="openfoodfacts",
                status="external_suggestion",
                barcode=barcode,
                product_id=None,
                name=off_name,
                brand=brand,
                image_url=image_url,
                category_id=None,
                category_name=category_name,
                price=None,
                cost=None,
                stock_quantity=None,
                low_stock_threshold=None,
                description=None,
            )
        except Exception:
            return BarcodeLookupResponse(found=False, source="none", status="not_found", barcode=barcode)

    @staticmethod
    def _extract_image_url(product: dict) -> Optional[str]:
        candidates = [
            product.get("image_url"),
            product.get("front_image_url"),
            product.get("selected_images", {}).get("front", {}).get("display", {}).get("es"),
            product.get("selected_images", {}).get("front", {}).get("display", {}).get("en"),
        ]
        for candidate in candidates:
            if isinstance(candidate, str) and candidate.startswith("http"):
                return candidate
        return None

    @staticmethod
    def _extract_category(categories_tags) -> Optional[str]:
        if not categories_tags:
            return None

        for tag in categories_tags:
            tag_lower = str(tag).lower()
            for key, value in CATEGORY_MAP.items():
                if key in tag_lower:
                    return value
        return None

    @staticmethod
    async def _upsert_cache(session: AsyncSession, barcode: str, off_data: dict) -> None:
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=30)
        query = select(ExternalProductCache).where(ExternalProductCache.barcode == barcode)
        result = await session.execute(query)
        existing = result.scalars().first()

        cache_data = {
            "source": "openfoodfacts",
            "product_name": off_data.get("product_name"),
            "brand": off_data.get("brand"),
            "image_url": off_data.get("image_url"),
            "category_name": off_data.get("category_name"),
            "raw_response": off_data.get("raw_response"),
            "last_fetched_at": now,
            "expires_at": expires_at,
        }
        if existing:
            for key, value in cache_data.items():
                setattr(existing, key, value)
        else:
            session.add(ExternalProductCache(barcode=barcode, **cache_data))

        await session.commit()
