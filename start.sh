#!/bin/sh
# Run migrations before start (Railway/Render/Docker)
# Use explicit revision to avoid "Multiple head revisions" when Docker env has path quirks
alembic upgrade 36a1b2c3d4e5 || true
# Railway injects PORT; default 8000 for local Docker
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
