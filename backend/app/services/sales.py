import uuid
from collections import defaultdict
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import case, func, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import selectinload

from app.models.sales import Sale, SaleItem, SalePayment
from app.models.inventory import StockBalance, InventoryMovement
from app.schemas.sales import SaleCreate, SaleResponse, SaleItemResponse, SalePaymentResponse


class SalesService:
    @staticmethod
    async def create_sale(session: AsyncSession, sale_in: SaleCreate) -> SaleResponse:
        """
        Creates a sale, sale items, and updates stock balances atomically.
        If any step fails, the whole transaction rolls back.
        """
        # Validate totals in a real implementation (sum of items vs subtotal)

        stock_requirements: dict[int, int] = defaultdict(int)
        for item_in in sale_in.items:
            if item_in.product_id:
                stock_requirements[item_in.product_id] += item_in.quantity

        if stock_requirements:
            product_ids = list(stock_requirements.keys())
            required_case = case(
                dict(stock_requirements),
                value=StockBalance.product_id,
                else_=0,
            )
            stock_update = (
                update(StockBalance)
                .where(
                    StockBalance.store_id == sale_in.store_id,
                    StockBalance.product_id.in_(product_ids),
                    StockBalance.stock >= required_case,
                )
                .values(
                    stock=StockBalance.stock - required_case,
                    updated_at=func.now(),
                )
                .returning(StockBalance.product_id)
            )
            stock_result = await session.execute(stock_update)
            updated_product_ids = set(stock_result.scalars().all())
            if updated_product_ids != set(product_ids):
                raise ValueError("STOCK_INSUFFICIENT")

        # 1. Create Sale
        db_sale = Sale(
            business_id=sale_in.business_id,
            store_id=sale_in.store_id,
            cashier_id=sale_in.cashier_id,
            status="completed",
            subtotal=sum(item.price_at_sale * item.quantity for item in sale_in.items),
            discount_total=sum(item.discount_amount for item in sale_in.items),
            tax_total=0, # Simplified
            total_amount=sum((item.price_at_sale * item.quantity) - item.discount_amount for item in sale_in.items),
            client_generated_id=sale_in.client_generated_id or uuid.uuid4()
        )
        session.add(db_sale)
        await session.flush() # Get sale ID

        # 2. Add Sale Items and record signed inventory movements
        sale_items: list[SaleItem] = []
        for item_in in sale_in.items:
            db_item = SaleItem(
                sale_id=db_sale.id,
                **item_in.model_dump()
            )
            session.add(db_item)
            sale_items.append(db_item)

            if item_in.product_id:
                # Movement log
                movement = InventoryMovement(
                    business_id=sale_in.business_id,
                    store_id=sale_in.store_id,
                    product_id=item_in.product_id,
                    movement_type="sale",
                    quantity=-item_in.quantity,
                    reference_type="sale",
                    reference_id=db_sale.id,
                    created_by=sale_in.cashier_id
                )
                session.add(movement)

        # 3. Add Payments
        sale_payments: list[SalePayment] = []
        for payment_in in sale_in.payments:
            db_payment = SalePayment(
                sale_id=db_sale.id,
                **payment_in.model_dump()
            )
            session.add(db_payment)
            sale_payments.append(db_payment)

        # 4. Flush inserts once so generated IDs/default timestamps are available
        await session.flush()

        # 5. Commit atomic transaction
        await session.commit()

        # 6. Return the created sale without an extra reload round-trip
        return SaleResponse(
            id=db_sale.id,
            business_id=db_sale.business_id,
            store_id=db_sale.store_id,
            cashier_id=db_sale.cashier_id,
            status=db_sale.status,
            subtotal=db_sale.subtotal,
            discount_total=db_sale.discount_total,
            tax_total=db_sale.tax_total,
            total_amount=db_sale.total_amount,
            client_generated_id=db_sale.client_generated_id,
            created_at=db_sale.created_at,
            items=[SaleItemResponse.model_validate(item) for item in sale_items],
            payments=[SalePaymentResponse.model_validate(payment) for payment in sale_payments],
        )

    @staticmethod
    async def get_sales_history(session: AsyncSession, business_id: int) -> List[Sale]:
        query = (
            select(Sale)
            .where(Sale.business_id == business_id, Sale.status != "cancelled")
            .options(selectinload(Sale.items), selectinload(Sale.payments))
            .order_by(Sale.created_at.desc())
        )
        result = await session.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def cancel_sale(
        session: AsyncSession,
        sale_id: int,
        business_id: int | None = None,
    ) -> Sale | None:
        """
        Cancels a completed sale without deleting historical rows.
        Stock is restored and audited with positive inventory movements.
        """
        filters = [Sale.id == sale_id]
        if business_id is not None:
            filters.append(Sale.business_id == business_id)

        result = await session.execute(
            select(Sale)
            .where(*filters)
            .options(selectinload(Sale.items), selectinload(Sale.payments))
            .with_for_update()
        )
        sale = result.scalars().first()
        if not sale:
            return None

        if sale.status == "cancelled":
            return sale
        if sale.status != "completed":
            raise ValueError("SALE_NOT_COMPLETED")

        restored_quantities: dict[int, int] = defaultdict(int)
        for item in sale.items:
            if item.product_id:
                restored_quantities[item.product_id] += item.quantity

        if restored_quantities:
            stock_rows = [
                {
                    "store_id": sale.store_id,
                    "product_id": product_id,
                    "stock": quantity,
                }
                for product_id, quantity in restored_quantities.items()
            ]
            stock_insert = pg_insert(StockBalance).values(stock_rows)
            await session.execute(
                stock_insert.on_conflict_do_update(
                    index_elements=[StockBalance.store_id, StockBalance.product_id],
                    set_={
                        "stock": StockBalance.stock + stock_insert.excluded.stock,
                        "updated_at": func.now(),
                    },
                )
            )

        for product_id, quantity in restored_quantities.items():
            session.add(
                InventoryMovement(
                    business_id=sale.business_id,
                    store_id=sale.store_id,
                    product_id=product_id,
                    movement_type="return",
                    quantity=quantity,
                    reference_type="sale_cancellation",
                    reference_id=sale.id,
                    notes="Sale cancelled",
                    created_by=sale.cashier_id,
                )
            )

        sale.status = "cancelled"
        await session.commit()
        return sale
