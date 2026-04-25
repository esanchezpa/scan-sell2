from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


# --- Categories ---
class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    business_id: int

class CategoryResponse(CategoryBase):
    id: int
    business_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Products ---
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    cost: float
    low_stock_threshold: int = 5
    image_url: Optional[str] = None
    is_active: bool = True
    category_id: Optional[int] = None

class ProductCreate(ProductBase):
    business_id: int
    barcode: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    low_stock_threshold: Optional[int] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    category_id: Optional[int] = None

class ProductResponse(ProductBase):
    id: int
    business_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


# --- Barcodes ---
class ProductBarcodeBase(BaseModel):
    barcode: str
    is_primary: bool = False

class ProductBarcodeCreate(ProductBarcodeBase):
    product_id: int
    business_id: int

class ProductBarcodeResponse(ProductBarcodeBase):
    id: int
    product_id: int
    business_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
