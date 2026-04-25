from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.settings import AppSettingCreate, AppSettingResponse
from app.services.settings import SettingsService

router = APIRouter(prefix="/settings", tags=["settings"])

@router.get("/", response_model=List[AppSettingResponse])
async def get_settings(business_id: int, db: AsyncSession = Depends(get_db)):
    return await SettingsService.get_settings(db, business_id)

@router.post("/", response_model=AppSettingResponse)
async def set_setting(setting_in: AppSettingCreate, db: AsyncSession = Depends(get_db)):
    return await SettingsService.set_setting(db, setting_in)
