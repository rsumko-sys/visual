#!/bin/bash
# Локальний запуск API (SQLite)
# Використання: ./run-local.sh

cd "$(dirname "$0")"
export DATABASE_URL="${DATABASE_URL:-sqlite:///./osint.db}"
echo "Starting API on http://127.0.0.1:8000 (DATABASE_URL=$DATABASE_URL)"
exec uvicorn app.main:app --host 127.0.0.1 --port 8000
