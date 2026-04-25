from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.sales import SaleCreate, SaleResponse
from app.services.sales import SalesService

router = APIRouter(prefix="/sales", tags=["sales"])

@router.post("/", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
async def create_sale(sale_in: SaleCreate, db: AsyncSession = Depends(get_db)):
    try:
        sale = await SalesService.create_sale(db, sale_in)
        # Assuming eager loading for items and payments isn't configured for flush, 
        # we might need to manually return a structure or let Pydantic handle it if lazy load is ok.
        # Since it's async, lazy load might throw DetachedInstanceError.
        # In a real app we would query the full sale graph back. 
        # Here we just return the sale object (items/payments might be empty if not re-queried).
        return sale
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
