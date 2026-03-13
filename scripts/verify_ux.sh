#!/bin/bash
# Verify UX flow — API + endpoints used by Dossier
API="${API_URL:-https://robust-kindness-production.up.railway.app}"
DOSSIER="${DOSSIER_URL:-https://dossier-production-871b.up.railway.app}"

echo "=== UX Verification ==="
echo "API: $API"
echo "Dossier: $DOSSIER"
echo ""

fail=0

# 1. Health
r=$(curl -s -o /dev/null -w "%{http_code}" "$API/health/")
[ "$r" = "200" ] && echo "[OK] GET /health/" || { echo "[FAIL] /health/ -> $r"; fail=1; }

# 2. Register
user="uxverify_$$"
reg=$(curl -s -X POST "$API/auth/register" -H "Content-Type: application/json" \
  -d "{\"username\":\"$user\",\"email\":\"$user@test.local\",\"password\":\"TestPass123!\"}")
echo "$reg" | jq -e '.username' >/dev/null 2>&1 && echo "[OK] POST /auth/register" || { echo "[FAIL] register"; fail=1; }

# 3. Login
tok=$(curl -s -X POST "$API/auth/token" -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$user&password=TestPass123!" | jq -r '.access_token')
[ -n "$tok" ] && [ "$tok" != "null" ] && echo "[OK] POST /auth/token" || { echo "[FAIL] login"; fail=1; }

# 4. Tools (auth)
r=$(curl -s -o /dev/null -w "%{http_code}" "$API/tools/" -H "Authorization: Bearer $tok")
[ "$r" = "200" ] && echo "[OK] GET /tools/ (auth)" || { echo "[FAIL] /tools/ -> $r"; fail=1; }

# 5. Create investigation
inv=$(curl -s -X POST "$API/investigations/" -H "Authorization: Bearer $tok" -H "Content-Type: application/json" \
  -d '{"title":"UX Test","description":"Verification","target_identifier":"test"}' | jq -r '.id')
[ -n "$inv" ] && [ "$inv" != "null" ] && echo "[OK] POST /investigations/" || { echo "[FAIL] create investigation"; fail=1; }

# 6. Run tool
run=$(curl -s -X POST "$API/tools/shodan/run" -H "Authorization: Bearer $tok" -H "Content-Type: application/json" \
  -d "{\"query\":\"8.8.8.8\",\"investigation_id\":\"$inv\"}")
task=$(echo "$run" | jq -r '.task_id')
[ -n "$task" ] && [ "$task" != "null" ] && echo "[OK] POST /tools/shodan/run (task: $task)" || { echo "[FAIL] run tool"; fail=1; }

# 7. Task status
r=$(curl -s -o /dev/null -w "%{http_code}" "$API/tools/status/$task" -H "Authorization: Bearer $tok")
[ "$r" = "200" ] && echo "[OK] GET /tools/status/{id}" || { echo "[FAIL] status -> $r"; fail=1; }

# 8. Dossier loads
r=$(curl -s -o /dev/null -w "%{http_code}" "$DOSSIER/")
[ "$r" = "200" ] && echo "[OK] Dossier GET /" || { echo "[FAIL] Dossier -> $r"; fail=1; }

echo ""
[ $fail -eq 0 ] && echo "=== All UX checks PASSED ===" || echo "=== Some checks FAILED ==="
exit $fail
