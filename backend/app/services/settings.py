from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.core import AppSetting
from app.schemas.settings import AppSettingCreate, AppSettingUpdate


class SettingsService:
    @staticmethod
    async def get_settings(session: AsyncSession, business_id: int) -> List[AppSetting]:
        query = select(AppSetting).where(AppSetting.business_id == business_id)
        result = await session.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_setting(session: AsyncSession, business_id: int, key: str) -> Optional[AppSetting]:
        query = select(AppSetting).where(
            AppSetting.business_id == business_id,
            AppSetting.setting_key == key
        )
        result = await session.execute(query)
        return result.scalars().first()

    @staticmethod
    async def set_setting(session: AsyncSession, setting_in: AppSettingCreate) -> AppSetting:
        db_setting = await SettingsService.get_setting(session, setting_in.business_id, setting_in.setting_key)
        if db_setting:
            db_setting.setting_value = setting_in.setting_value
        else:
            db_setting = AppSetting(**setting_in.model_dump())
            session.add(db_setting)
        
        await session.commit()
        await session.refresh(db_setting)
        return db_setting
