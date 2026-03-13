#!/bin/bash
# Register admin user via API
# Usage: API_URL=https://your-api.up.railway.app ./scripts/register_admin.sh
API_URL="${API_URL:-https://robust-kindness-production.up.railway.app}"

curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@example.com","password":"'${ADMIN_PASSWORD:-1488}'"}'

echo ""
