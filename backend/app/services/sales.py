import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.sales import Sale, SaleItem, SalePayment
from app.models.inventory import StockBalance, InventoryMovement
from app.schemas.sales import SaleCreate


class SalesService:
    @staticmethod
    async def create_sale(session: AsyncSession, sale_in: SaleCreate) -> Sale:
        """
        Creates a sale, sale items, and updates stock balances atomically.
        If any step fails, the whole transaction rolls back.
        """
        # Validate totals in a real implementation (sum of items vs subtotal)
        
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

        # 2. Add Sale Items & Update Stock
        for item_in in sale_in.items:
            db_item = SaleItem(
                sale_id=db_sale.id,
                **item_in.model_dump()
            )
            session.add(db_item)

            if item_in.product_id:
                # Stock decrement
                query = select(StockBalance).where(
                    StockBalance.store_id == sale_in.store_id,
                    StockBalance.product_id == item_in.product_id
                )
                result = await session.execute(query)
                stock_balance = result.scalars().first()

                if stock_balance:
                    stock_balance.stock -= item_in.quantity
                else:
                    stock_balance = StockBalance(
                        store_id=sale_in.store_id,
                        product_id=item_in.product_id,
                        stock=-item_in.quantity
                    )
                    session.add(stock_balance)

                # Movement log
                movement = InventoryMovement(
                    business_id=sale_in.business_id,
                    store_id=sale_in.store_id,
                    product_id=item_in.product_id,
                    movement_type="sale",
                    quantity=item_in.quantity,
                    reference_type="sale",
                    reference_id=db_sale.id,
                    created_by=sale_in.cashier_id
                )
                session.add(movement)

        # 3. Add Payments
        for payment_in in sale_in.payments:
            db_payment = SalePayment(
                sale_id=db_sale.id,
                **payment_in.model_dump()
            )
            session.add(db_payment)

        # 4. Commit atomic transaction
        await session.commit()

        # 5. Reload with relationships
        from sqlalchemy.orm import selectinload
        reloaded = await session.execute(
            select(Sale)
            .where(Sale.id == db_sale.id)
            .options(selectinload(Sale.items), selectinload(Sale.payments))
        )
        db_sale = reloaded.scalars().first()

        return db_sale

    @staticmethod
    async def get_sales_history(session: AsyncSession, business_id: int) -> List[Sale]:
        from sqlalchemy.orm import selectinload
        query = (
            select(Sale)
            .where(Sale.business_id == business_id)
            .options(selectinload(Sale.items), selectinload(Sale.payments))
            .order_by(Sale.created_at.desc())
        )
        result = await session.execute(query)
        return list(result.scalars().all())
