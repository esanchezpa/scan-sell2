from typing import Optional
from pydantic import BaseModel

class BarcodeLookupResponse(BaseModel):
    found: bool
    source: Optional[str] = None  # "internal", "cache", "openfoodfacts"
    barcode: str
    product_id: Optional[int] = None
    name: Optional[str] = None
    brand: Optional[str] = None
    image_url: Optional[str] = None
    category_name: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    stock_quantity: Optional[int] = None