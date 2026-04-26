"""Add unique stock balance constraint

Revision ID: b91c2d3e4f5a
Revises: a7b3c9d4e5f6
Create Date: 2026-04-26 12:20:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = "b91c2d3e4f5a"
down_revision: Union[str, None] = "a7b3c9d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS app_settings (
            id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            business_id BIGINT NOT NULL,
            setting_key VARCHAR NOT NULL,
            setting_value VARCHAR NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        )
        """
    )

    op.execute(
        """
        WITH ranked AS (
            SELECT
                id,
                store_id,
                product_id,
                SUM(stock) OVER (
                    PARTITION BY store_id, product_id
                ) AS merged_stock,
                ROW_NUMBER() OVER (
                    PARTITION BY store_id, product_id
                    ORDER BY updated_at DESC NULLS LAST, id DESC
                ) AS row_number
            FROM stock_balances
        )
        UPDATE stock_balances AS sb
        SET stock = ranked.merged_stock
        FROM ranked
        WHERE sb.id = ranked.id
          AND ranked.row_number = 1
        """
    )

    op.execute(
        """
        WITH ranked AS (
            SELECT
                id,
                ROW_NUMBER() OVER (
                    PARTITION BY store_id, product_id
                    ORDER BY updated_at DESC NULLS LAST, id DESC
                ) AS row_number
            FROM stock_balances
        )
        DELETE FROM stock_balances AS sb
        USING ranked
        WHERE sb.id = ranked.id
          AND ranked.row_number > 1
        """
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conrelid = 'stock_balances'::regclass
                  AND conname = 'uq_stock_balances_store_product'
                  AND contype = 'u'
            ) THEN
                RETURN;
            END IF;

            IF EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conrelid = 'stock_balances'::regclass
                  AND conname = 'stock_balances_store_id_product_id_key'
                  AND contype = 'u'
            ) THEN
                ALTER TABLE stock_balances
                RENAME CONSTRAINT stock_balances_store_id_product_id_key
                TO uq_stock_balances_store_product;
                RETURN;
            END IF;

            ALTER TABLE stock_balances
            ADD CONSTRAINT uq_stock_balances_store_product
            UNIQUE (store_id, product_id);
        END $$;
        """
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_stock_balances_store_product",
        "stock_balances",
        type_="unique",
    )
