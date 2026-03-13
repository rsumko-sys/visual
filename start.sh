#!/bin/sh
set -e

echo "Starting Container..."

# Clear ALL Alembic caches
rm -rf alembic/__pycache__ alembic/versions/__pycache__ .pytest_cache 2>/dev/null || true

# Force delete old DB
rm -f osint.db osint.db-shm osint.db-wal 2>/dev/null || true

# Clear Python bytecode
find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true

echo "Running migrations..."

# Run migrations
python -m alembic upgrade 99c58f04711c || true

echo "Starting application..."

# Start app
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
