#!/bin/bash
# Register admin user via API
# Usage: API_URL=https://your-api.up.railway.app ./scripts/register_admin.sh
API_URL="${API_URL:-}"
if [ -z "$API_URL" ]; then
  echo "Usage: API_URL=https://robust-kindness-production-xxxx.up.railway.app ./scripts/register_admin.sh"
  exit 1
fi

curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@example.com","password":"YOUR_SECURE_PASSWORD"}'

echo ""
