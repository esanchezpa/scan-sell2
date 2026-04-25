import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


# --- Sale Items ---
class SaleItemCreate(BaseModel):
    product_id: Optional[int] = None
    product_name_at_sale: str
    barcode_at_sale: Optional[str] = None
    quantity: int
    price_at_sale: float
    cost_at_sale: float
    discount_amount: float = 0

class SaleItemResponse(SaleItemCreate):
    id: int
    sale_id: int
    model_config = ConfigDict(from_attributes=True)


# --- Sale Payments ---
class SalePaymentCreate(BaseModel):
    payment_method: str # 'cash', 'card', 'transfer'
    amount: float
    reference_code: Optional[str] = None

class SalePaymentResponse(SalePaymentCreate):
    id: int
    sale_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Sales ---
class SaleCreate(BaseModel):
    business_id: int
    store_id: int
    cashier_id: Optional[int] = None
    items: List[SaleItemCreate]
    payments: List[SalePaymentCreate]
    client_generated_id: Optional[uuid.UUID] = None

class SaleResponse(BaseModel):
    id: int
    business_id: int
    store_id: int
    cashier_id: Optional[int] = None
    status: str
    subtotal: float
    discount_total: float
    tax_total: float
    total_amount: float
    client_generated_id: Optional[uuid.UUID] = None
    created_at: datetime
    items: List[SaleItemResponse] = []
    payments: List[SalePaymentResponse] = []
    model_config = ConfigDict(from_attributes=True)
