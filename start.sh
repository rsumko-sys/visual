#!/bin/sh
set -e

echo "Starting Container..."

# Clear Alembic cache
rm -rf alembic/__pycache__ alembic/versions/__pycache__ 2>/dev/null || true

# FORCE delete old DB to reset Alembic history completely
rm -f osint.db osint.db-shm osint.db-wal 2>/dev/null || true

echo "Running migrations..."

# Run migrations on fresh DB
alembic upgrade 99c58f04711c || true

echo "Starting application..."

# Start app
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
