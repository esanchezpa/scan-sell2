from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.inventory import StockBalance, InventoryMovement
from app.schemas.inventory import InventoryMovementCreate


class InventoryService:
    @staticmethod
    async def get_stock_for_store(session: AsyncSession, store_id: int) -> List[StockBalance]:
        query = select(StockBalance).where(StockBalance.store_id == store_id)
        result = await session.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def register_movement(session: AsyncSession, movement_in: InventoryMovementCreate) -> InventoryMovement:
        # Create the movement record
        movement = InventoryMovement(**movement_in.model_dump())
        session.add(movement)
        
        # Update or create the stock balance
        query = select(StockBalance).where(
            StockBalance.store_id == movement_in.store_id,
            StockBalance.product_id == movement_in.product_id
        )
        result = await session.execute(query)
        stock_balance = result.scalars().first()

        net_quantity = movement_in.quantity if movement_in.movement_type == "in" else -movement_in.quantity
        if movement_in.movement_type == "adjustment":
            net_quantity = movement_in.quantity # the API should pass the difference or absolute? For now, diff

        if stock_balance:
            stock_balance.stock += net_quantity
        else:
            stock_balance = StockBalance(
                store_id=movement_in.store_id,
                product_id=movement_in.product_id,
                stock=net_quantity
            )
            session.add(stock_balance)

        await session.commit()
        await session.refresh(movement)
        return movement
