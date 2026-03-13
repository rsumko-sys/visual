"""add pg_stat_statements extension for Railway Data UI

Revision ID: 36a1b2c3d4e5
Revises: 35b02fb2ec00
Create Date: 2026-03-13

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '36a1b2c3d4e5'
down_revision: Union[str, Sequence[str], None] = '35b02fb2ec00'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create pg_stat_statements extension (PostgreSQL only, for Railway Data UI)."""
    conn = op.get_bind()
    if conn.dialect.name == 'postgresql':
        try:
            op.execute("CREATE EXTENSION IF NOT EXISTS pg_stat_statements")
        except Exception:
            # Extension may not be installed in image; safe to skip
            pass


def downgrade() -> None:
    """Drop pg_stat_statements extension."""
    conn = op.get_bind()
    if conn.dialect.name == 'postgresql':
        try:
            op.execute("DROP EXTENSION IF EXISTS pg_stat_statements")
        except Exception:
            pass
