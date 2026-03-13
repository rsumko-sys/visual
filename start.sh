#!/bin/sh
set -e

# One-time: old revisions deleted; reset DB so Alembic can apply fresh 99c58f04711c
python3 -c "
import sqlite3, os
path = 'osint.db'
if os.path.exists(path):
    try:
        c = sqlite3.connect(path)
        r = c.execute('SELECT version_num FROM alembic_version').fetchone()
        if r and r[0] in ('35b02fb2ec00', '36a1b2c3d4e5', 'a029578f5057'):
            c.close()
            os.remove(path)
    except Exception: pass
" 2>/dev/null || true

# Run migrations (single clean revision)
alembic upgrade 99c58f04711c || true

# Start app (Railway injects PORT)
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
