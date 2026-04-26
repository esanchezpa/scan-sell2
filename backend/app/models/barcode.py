from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, String, DateTime, func, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ExternalProductCache(Base):
    __tablename__ = "external_product_cache"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    barcode: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    source: Mapped[str] = mapped_column(String, nullable=False)
    product_name: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    brand: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    raw_response: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    last_fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)