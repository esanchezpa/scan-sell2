from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, String, Boolean, DateTime, func, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Store(Base):
    __tablename__ = "stores"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    business_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    business_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    firebase_uid: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, default="admin")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AppSetting(Base):
    """New table for global or store settings (like display mode)."""
    __tablename__ = "app_settings"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    business_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    setting_key: Mapped[str] = mapped_column(String, nullable=False) # e.g. "display_mode"
    setting_value: Mapped[str] = mapped_column(String, nullable=False) # e.g. "tablet"
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
