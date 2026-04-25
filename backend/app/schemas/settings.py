from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AppSettingBase(BaseModel):
    setting_key: str
    setting_value: str

class AppSettingCreate(AppSettingBase):
    business_id: int

class AppSettingUpdate(BaseModel):
    setting_value: str

class AppSettingResponse(AppSettingBase):
    id: int
    business_id: int
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
