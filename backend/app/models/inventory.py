from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, String, DateTime, func, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class StockBalance(Base):
    __tablename__ = "stock_balances"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    store_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    product_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    business_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    store_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    product_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    movement_type: Mapped[str] = mapped_column(String, nullable=False) # 'in', 'out', 'adjustment'
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    reference_type: Mapped[Optional[str]] = mapped_column(String, nullable=True) # 'sale', 'purchase', 'manual'
    reference_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
