#!/bin/sh
set -e

# Clear Alembic cache
rm -rf alembic/__pycache__ alembic/versions/__pycache__ 2>/dev/null || true

# Clear corrupted alembic_version table in SQLite (fixes "present more than once")
python3 -c "
import sqlite3, os
path = 'osint.db'
if os.path.exists(path):
    try:
        c = sqlite3.connect(path)
        c.execute('DELETE FROM alembic_version')
        c.commit()
        c.close()
    except Exception: pass
" 2>/dev/null || true

# Run migrations
alembic upgrade a029578f5057 || true

# Start app (Railway injects PORT)
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
