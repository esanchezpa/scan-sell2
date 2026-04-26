from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.product import Product, ProductBarcode
from app.models.product import external_product_cache
from app.schemas.barcode import BarcodeLookupResponse
import httpx
import json

class BarcodeService:
    OPENFOODFACTS_URL = "https://world.openfoodfacts.org/api/v2/product/{barcode}.json"
    
    @staticmethod
    async def lookup(session: AsyncSession, business_id: int, barcode: str) -> BarcodeLookupResponse:
        # 1. Buscar producto interno activo
        internal_product = await BarcodeService._find_internal_product(session, business_id, barcode)
        if internal_product:
            return BarcodeLookupResponse(
                found=True,
                source="internal",
                barcode=barcode,
                product_id=internal_product.id,
                name=internal_product.name,
                brand=None,  # No stored in current schema
                image_url=internal_product.image_url,
                category_name=internal_product.category_name,
                price=internal_product.price,
                cost=internal_product.cost,
                stock_quantity=internal_product.stock_quantity
            )
        
        # 2. Buscar en cache
        cached = await BarcodeService._find_in_cache(session, barcode)
        if cached and BarcodeService._is_cache_valid(cached.expires_at):
            return BarcodeLookupResponse(
                found=True,
                source="cache",
                barcode=barcode,
                product_id=None,
                name=cached.product_name,
                brand=cached.brand,
                image_url=cached.image_url,
                category_name=cached.category_name,
                price=None,  # Cache no tiene precio/costo
                cost=None,
                stock_quantity=None
            )
        
        # 3. Llamar a OpenFoodFacts
        off_data = await BarcodeService._fetch_from_openfoodfacts(barcode)
        if not off_data:
            return BarcodeLookupResponse(
                found=False,
                source=None,
                barcode=barcode
            )
        
        # 4. Guardar/actualizar en cache
        await BarcodeService._upsert_cache(session, barcode, off_data)
        
        # 5. Devolver resultado
        return BarcodeLookupResponse(
            found=True,
            source="openfoodfacts",
            barcode=barcode,
            product_id=None,
            name=off_data.get("product_name"),
            brand=off_data.get("brand"),
            image_url=off_data.get("image_url"),
            category_name=off_data.get("category_name"),
            price=None,
            cost=None,
            stock_quantity=None
        )
    
    @staticmethod
    async def _find_internal_product(session: AsyncSession, business_id: int, barcode: str) -> Optional[Product]:
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
    async def _find_in_cache(session: AsyncSession, barcode: str):
        query = select(external_product_cache).where(
            external_product_cache.barcode == barcode
        )
        result = await session.execute(query)
        return result.scalars().first()
    
    @staticmethod
    def _is_cache_valid(expires_at) -> bool:
        from datetime import datetime, timezone
        if expires_at is None:
            return False
        now = datetime.now(timezone.utc)
        # Hacer que expires_at sea timezone-aware si no lo es
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        return expires_at > now
    
    @staticmethod
    async def _fetch_from_openfoodfacts(barcode: str) -> Optional[dict]:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    BarcodeService.OPENFOODFACTS_URL.format(barcode=barcode)
                )
                if response.status_code != 200:
                    return None
                
                data = response.json()
                if data.get("status") != 1 or not data.get("product"):
                    return None
                
                product = data["product"]
                return {
                    "product_name": product.get("product_name") or product.get("generic_name"),
                    "brand": product.get("brands"),
                    "image_url": product.get("image_url") or product.get("front_image_url"),
                    "category_name": BarcodeService._extract_category(product.get("categories_tags", [])),
                    "raw_response": data
                }
        except Exception:
            return None
    
    @staticmethod
    def _extract_category(categories_tags) -> Optional[str]:
        if not categories_tags:
            return None
        
        # Mapeo simple de categorías de OpenFoodFacts a nuestras categorías
        category_map = {
            "bebidas": ["beverages", "drinks"],
            "snacks": ["snacks", "sweet snacks", "salty snacks"],
            "abarrotes": ["food", "canned", "breakfast foods"],
            "limpieza": ["cleaning", "household", "detergent"],
            "cuidado personal": ["hygiene", "beauty", "personal care"]
        }
        
        for tag in categories_tags:
            tag_lower = tag.lower()
            for our_cat, off_cats in category_map.items():
                if any(off_cat in tag_lower for off_cat in off_cats):
                    return our_cat
        
        return categories_tags[0].lower() if categories_tags else None
    
    @staticmethod
    async def _upsert_cache(session: AsyncSession, barcode: str, off_data: dict):
        from datetime import datetime, timedelta, timezone
        
        # Buscar si ya existe
        existing = await BarcodeService._find_in_cache(session, barcode)
        
        cache_data = {
            "barcode": barcode,
            "source": "openfoodfacts",
            "product_name": off_data.get("product_name"),
            "brand": off_data.get("brand"),
            "image_url": off_data.get("image_url"),
            "category_name": off_data.get("category_name"),
            "raw_response": off_data.get("raw_response"),
            "last_fetched_at": datetime.now(timezone.utc),
            "expires_at": datetime.now(timezone.utc) + timedelta(days=30)
        }
        
        if existing:
            # Actualizar
            for key, value in cache_data.items():
                setattr(existing, key, value)
            session.add(existing)
        else:
            # Crear nuevo
            cache_entry = external_product_cache(**cache_data)
            session.add(cache_entry)