#!/bin/bash
# Register admin user via API
# Usage: API_URL=https://your-api.up.railway.app ./scripts/register_admin.sh
API_URL="${API_URL:-https://robust-kindness-production.up.railway.app}"

for i in 1 2 3 4 5 6 7 8 9 10; do
  resp=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","email":"admin@example.com","password":"'${ADMIN_PASSWORD:-1488}'"}')
  code=$(echo "$resp" | tail -1)
  body=$(echo "$resp" | sed '$d')
  if [ "$code" = "201" ] || [ "$code" = "200" ]; then
    echo "$body" | jq . 2>/dev/null || echo "$body"
    echo "Admin registered (admin / ${ADMIN_PASSWORD:-1488})"
    exit 0
  fi
  if [ "$code" = "400" ]; then
    echo "$body" | jq . 2>/dev/null || echo "$body"
    echo "Admin may already exist. Try login."
    exit 0
  fi
  echo "Attempt $i: HTTP $code, retrying in 15s..."
  sleep 15
done
echo "API unreachable after 10 attempts"
exit 1
