#!/bin/sh
set -e

# Ensure we're in app root (critical for rm paths)
cd /app

echo "Starting Container..."

# Clear ALL caches (including any baked-in bytecode)
rm -rf alembic/__pycache__ alembic/versions/__pycache__ .pytest_cache 2>/dev/null || true
find /app -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
find /app -name "*.pyc" -delete 2>/dev/null || true

# Force delete old DB — absolute paths to guarantee deletion
rm -f /app/osint.db /app/osint.db-shm /app/osint.db-wal 2>/dev/null || true

echo "Running migrations..."

# Run migrations
python -m alembic upgrade head

echo "Starting application..."

# Start app
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
