"""add issue image url

Revision ID: c2f8f9877a11
Revises: 4e8261ae358b
Create Date: 2026-03-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c2f8f9877a11'
down_revision = '4e8261ae358b'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [column['name'] for column in inspector.get_columns('issues')]
    if 'image_url' not in columns:
        op.add_column('issues', sa.Column('image_url', sa.String(length=500), nullable=True))


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [column['name'] for column in inspector.get_columns('issues')]
    if 'image_url' in columns:
        op.drop_column('issues', 'image_url')
