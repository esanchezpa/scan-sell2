"""add_settings_table

Revision ID: 94b69dff3d95
Revises: 
Create Date: 2026-04-24 22:56:14.280624

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '94b69dff3d95'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'app_settings',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('business_id', sa.BigInteger(), nullable=False),
        sa.Column('setting_key', sa.String(), nullable=False),
        sa.Column('setting_value', sa.String(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('app_settings')
