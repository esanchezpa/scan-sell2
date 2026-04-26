from typing import Optional

from pydantic import BaseModel


class BarcodeLookupResponse(BaseModel):
    found: bool
    source: Optional[str] = None
    status: Optional[str] = None
    barcode: str
    product_id: Optional[int] = None
    name: Optional[str] = None
    brand: Optional[str] = None
    image_url: Optional[str] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    stock_quantity: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    description: Optional[str] = None


class ProductReactivateRequest(BaseModel):
    business_id: int
    store_id: int
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    category_id: Optional[int] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    image_url: Optional[str] = None
    low_stock_threshold: Optional[int] = None
    stock_quantity: Optional[int] = None
