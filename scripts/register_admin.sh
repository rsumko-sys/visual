#!/bin/bash
# Register admin user - replace API_URL with your Railway API domain
API_URL="${API_URL:-https://robust-kindness-production-XXXX.up.railway.app}"

curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@example.com","password":"1488"}'

echo ""
