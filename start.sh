#!/bin/sh
# Run migrations before start (Railway/Render/Docker)
# Clear Alembic cache to avoid "Revision X is present more than once"
rm -rf alembic/__pycache__ alembic/versions/__pycache__ 2>/dev/null || true
# Explicit revision (not "head") avoids "Multiple head revisions" on Railway.
alembic upgrade a029578f5057 || true
# Railway injects PORT; default 8000 for local Docker
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
