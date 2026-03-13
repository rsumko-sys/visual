#!/bin/sh
# Run migrations before start (Railway/Render/Docker)
# Explicit revision (not "head") avoids "Multiple head revisions" on Railway.
# When adding new migrations: run `alembic heads` and update this ID.
alembic upgrade a029578f5057 || true
# Railway injects PORT; default 8000 for local Docker
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
