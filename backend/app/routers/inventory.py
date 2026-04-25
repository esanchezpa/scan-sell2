from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.inventory import StockBalanceResponse, InventoryMovementCreate, InventoryMovementResponse
from app.services.inventory import InventoryService

router = APIRouter(prefix="/inventory", tags=["inventory"])

@router.get("/stock/{store_id}", response_model=List[StockBalanceResponse])
async def get_stock(store_id: int, db: AsyncSession = Depends(get_db)):
    return await InventoryService.get_stock_for_store(db, store_id)

@router.post("/movement", response_model=InventoryMovementResponse)
async def register_movement(movement_in: InventoryMovementCreate, db: AsyncSession = Depends(get_db)):
    return await InventoryService.register_movement(db, movement_in)
