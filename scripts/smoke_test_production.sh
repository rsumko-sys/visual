#!/bin/bash
# Smoke test for production API and Dossier
# Usage: API_URL=https://your-api.up.railway.app DOSSIER_URL=https://dossier... ./scripts/smoke_test_production.sh

API_URL="${API_URL:-https://robust-kindness-production.up.railway.app}"
DOSSIER_URL="${DOSSIER_URL:-https://dossier-production-871b.up.railway.app}"

echo "=== Smoke Test: $API_URL ==="
fail=0

# API root
r=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/")
if [ "$r" = "200" ]; then
  echo "  [OK] GET / -> $r"
else
  echo "  [FAIL] GET / -> $r (expected 200)"
  fail=1
fi

# Health
r=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health/")
if [ "$r" = "200" ]; then
  echo "  [OK] GET /health/ -> $r"
else
  echo "  [FAIL] GET /health/ -> $r (expected 200)"
  fail=1
fi

# Tools list
r=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/tools/")
if [ "$r" = "200" ]; then
  echo "  [OK] GET /tools/ -> $r"
else
  echo "  [FAIL] GET /tools/ -> $r (expected 200)"
  fail=1
fi

# Auth register
r=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"smoke_test","email":"smoke@test.local","password":"TestPass123!"}')
if [ "$r" = "200" ] || [ "$r" = "201" ] || [ "$r" = "400" ]; then
  echo "  [OK] POST /auth/register -> $r"
else
  echo "  [FAIL] POST /auth/register -> $r"
  fail=1
fi

echo ""
echo "=== Smoke Test: Dossier $DOSSIER_URL ==="
r=$(curl -s -o /dev/null -w "%{http_code}" "$DOSSIER_URL/")
if [ "$r" = "200" ]; then
  echo "  [OK] GET / -> $r"
else
  echo "  [FAIL] GET / -> $r (expected 200)"
  fail=1
fi

echo ""
if [ $fail -eq 0 ]; then
  echo "=== All smoke tests PASSED ==="
  exit 0
else
  echo "=== Some tests FAILED ==="
  exit 1
fi
