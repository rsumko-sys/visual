"""merge heads

Revision ID: a029578f5057
Revises: 36a1b2c3d4e5
Create Date: 2026-03-13 18:46:31.401933

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a029578f5057'
down_revision: Union[str, Sequence[str], None] = '36a1b2c3d4e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
