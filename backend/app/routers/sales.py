from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.schemas.sales import SaleCreate, SaleResponse
from app.services.sales import SalesService

router = APIRouter(prefix="/sales", tags=["sales"])

@router.post("/", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
async def create_sale(sale_in: SaleCreate, db: AsyncSession = Depends(get_db)):
    try:
        sale = await SalesService.create_sale(db, sale_in)
        return sale
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))
@router.get("/history", response_model=List[SaleResponse])
async def get_history(business_id: int = 1, db: AsyncSession = Depends(get_db)):
    return await SalesService.get_sales_history(db, business_id)
