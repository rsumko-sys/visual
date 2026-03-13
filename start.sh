#!/bin/sh
# Run migrations before start (Railway/Render/Docker)
# Explicit revision (not "head") avoids "Multiple head revisions" on Railway.
# When adding new migrations: update this ID to the new head (alembic heads).
alembic upgrade 36a1b2c3d4e5 || true
# Railway injects PORT; default 8000 for local Docker
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
