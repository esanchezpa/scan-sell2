import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, String, DateTime, func, Numeric, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    business_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    store_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    cashier_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String, default="completed")
    subtotal: Mapped[float] = mapped_column(Numeric, default=0)
    discount_total: Mapped[float] = mapped_column(Numeric, default=0)
    tax_total: Mapped[float] = mapped_column(Numeric, default=0)
    total_amount: Mapped[float] = mapped_column(Numeric, default=0)
    client_generated_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    items: Mapped[list["SaleItem"]] = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")
    payments: Mapped[list["SalePayment"]] = relationship("SalePayment", back_populates="sale", cascade="all, delete-orphan")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    sale_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("sales.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    product_name_at_sale: Mapped[str] = mapped_column(String, nullable=False)
    barcode_at_sale: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    price_at_sale: Mapped[float] = mapped_column(Numeric, nullable=False)
    cost_at_sale: Mapped[float] = mapped_column(Numeric, nullable=False)
    discount_amount: Mapped[float] = mapped_column(Numeric, default=0)

    # Relationship
    sale: Mapped["Sale"] = relationship("Sale", back_populates="items")


class SalePayment(Base):
    __tablename__ = "sale_payments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    sale_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("sales.id", ondelete="CASCADE"), nullable=False)
    payment_method: Mapped[str] = mapped_column(String, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric, nullable=False)
    reference_code: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    sale: Mapped["Sale"] = relationship("Sale", back_populates="payments")
