from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.barcode import BarcodeService
from app.schemas.barcode import BarcodeLookupResponse

router = APIRouter(prefix="/barcode", tags=["barcode"])

@router.get("/lookup/{barcode}", response_model=BarcodeLookupResponse)
async def lookup_barcode(barcode: str, business_id: int, db: AsyncSession = Depends(get_db)):
    return await BarcodeService.lookup(db, business_id, barcode)