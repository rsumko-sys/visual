"""initial schema

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2026-03-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - create tables."""
    op.create_table('users',
        sa.Column('id', sa.VARCHAR(), nullable=False),
        sa.Column('username', sa.VARCHAR(), nullable=False),
        sa.Column('email', sa.VARCHAR(), nullable=True),
        sa.Column('hashed_password', sa.VARCHAR(), nullable=False),
        sa.Column('is_active', sa.BOOLEAN(), nullable=True),
        sa.Column('created_at', sa.DATETIME(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_table('investigations',
        sa.Column('id', sa.VARCHAR(), nullable=False),
        sa.Column('owner_id', sa.VARCHAR(), nullable=False),
        sa.Column('title', sa.VARCHAR(), nullable=False),
        sa.Column('description', sa.TEXT(), nullable=True),
        sa.Column('target_identifier', sa.VARCHAR(), nullable=True),
        sa.Column('status', sa.VARCHAR(), nullable=True),
        sa.Column('created_at', sa.DATETIME(), nullable=True),
        sa.Column('updated_at', sa.DATETIME(), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_investigations_target_identifier'), 'investigations', ['target_identifier'], unique=False)
    op.create_table('evidence',
        sa.Column('id', sa.VARCHAR(), nullable=False),
        sa.Column('investigation_id', sa.VARCHAR(), nullable=False),
        sa.Column('source', sa.VARCHAR(), nullable=True),
        sa.Column('data', sa.TEXT(), nullable=True),
        sa.Column('metadata_json', sa.TEXT(), nullable=True),
        sa.Column('hash_sha256', sa.VARCHAR(), nullable=True),
        sa.Column('created_at', sa.DATETIME(), nullable=True),
        sa.ForeignKeyConstraint(['investigation_id'], ['investigations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema - drop tables."""
    op.drop_table('evidence')
    op.drop_index(op.f('ix_investigations_target_identifier'), table_name='investigations')
    op.drop_table('investigations')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_table('users')
