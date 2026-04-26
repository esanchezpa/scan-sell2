from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


# --- Stock Balances ---
class StockBalanceResponse(BaseModel):
    id: int
    store_id: int
    product_id: int
    stock: int
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Inventory Movements ---
class InventoryMovementBase(BaseModel):
    movement_type: str # 'purchase', 'sale', 'return', 'adjustment', 'initial_stock'
    quantity: int
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    notes: Optional[str] = None

class InventoryMovementCreate(InventoryMovementBase):
    business_id: int
    store_id: int
    product_id: int
    created_by: Optional[int] = None

class InventoryMovementResponse(InventoryMovementBase):
    id: int
    business_id: int
    store_id: int
    product_id: int
    created_by: Optional[int] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
