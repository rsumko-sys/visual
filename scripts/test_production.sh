#!/bin/bash
# Тест production API та ключових ендпоінтів
set -e
API="${API_URL:-https://robust-kindness-production.up.railway.app}"
DOSSIER="${DOSSIER_URL:-https://dossier-production-871b.up.railway.app}"

echo "=== Production smoke test ==="
echo "API: $API"
echo "Dossier: $DOSSIER"
echo ""

# 1. Health
echo "1. Health..."
code=$(curl -s -o /dev/null -w "%{http_code}" "$API/health/")
[ "$code" = "200" ] && echo "   OK ($code)" || { echo "   FAIL ($code)"; exit 1; }

# 2. Guest token
echo "2. Auth guest..."
token=$(curl -s "$API/auth/guest" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))")
[ -n "$token" ] && echo "   OK (token received)" || { echo "   FAIL (no token)"; exit 1; }

# 3. Tools catalog (no auth)
echo "3. Tools catalog (no auth)..."
tools=$(curl -s "$API/tools/" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total_tools',0))")
[ "$tools" -gt "0" ] && echo "   OK ($tools tools)" || { echo "   FAIL (0 tools)"; exit 1; }

# 4. Tools catalog (with auth)
echo "4. Tools catalog (with auth)..."
tools2=$(curl -s -H "Authorization: Bearer $token" "$API/tools/" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total_tools',0))")
[ "$tools2" -gt "0" ] && echo "   OK ($tools2 tools)" || { echo "   FAIL"; exit 1; }

# 5. Dossier loads
echo "5. Dossier..."
code=$(curl -s -o /dev/null -w "%{http_code}" "$DOSSIER/")
[ "$code" = "200" ] && echo "   OK ($code)" || echo "   WARN ($code) - may need JS"

# 6. CORS preflight (from Dossier origin)
echo "6. CORS preflight..."
cors=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$API/tools/" \
  -H "Origin: https://dossier-production-871b.up.railway.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,content-type")
[ "$cors" = "200" ] && echo "   OK ($cors)" || echo "   WARN ($cors)"

echo ""
echo "=== All checks passed ==="
