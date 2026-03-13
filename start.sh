#!/bin/sh
# Run migrations before start (Railway/Render/Docker)
rm -rf alembic/__pycache__ alembic/versions/__pycache__ 2>/dev/null || true
# One-time fix for corrupted alembic_version: set CLEAR_ALEMBIC_VERSION=1 in Railway vars, deploy, then remove.
# Nuclear: RESET_SQLITE_DB=1 to delete osint.db for full fresh start (data loss).
if [ -n "$CLEAR_ALEMBIC_VERSION" ]; then
  python3 -c "
import sqlite3, os
path = os.environ.get('SQLITE_PATH', 'osint.db')
if os.path.exists(path):
    try:
        c = sqlite3.connect(path)
        c.execute('DELETE FROM alembic_version')
        c.commit()
        c.close()
    except Exception: pass
" 2>/dev/null || true
fi
if [ -n "$RESET_SQLITE_DB" ]; then
  rm -f osint.db 2>/dev/null || true
fi
alembic upgrade a029578f5057 || true
# Railway injects PORT; default 8000 for local Docker
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
