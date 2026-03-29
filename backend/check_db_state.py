from app import create_app
from sqlalchemy import text

app = create_app()

with app.app_context():
    with app.extensions['sqlalchemy'].engine.connect() as conn:
        # Check current version in alembic_version
        try:
            result = conn.execute(text("SELECT version_num FROM alembic_version"))
            versions = result.fetchall()
            print("Current migration version:", versions[-1] if versions else "No versions found")
        except Exception as e:
            print(f"Error querying alembic_version: {e}")
        
        # Check if image_url column exists
        try:
            result = conn.execute(text("PRAGMA table_info(issues)"))
            columns = result.fetchall()
            col_names = [row[1] for row in columns]
            print(f"Issues table columns: {col_names}")
            print(f"image_url present: {'image_url' in col_names}")
        except Exception as e:
            print(f"Error querying issues table: {e}")
