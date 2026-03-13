#!/bin/sh
# Run migrations before start (Railway/Render/Docker)
alembic upgrade head || true
# Railway injects PORT; default 8000 for local Docker
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
