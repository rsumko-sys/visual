#!/usr/bin/env python3
"""
Перевірка підключень до API OSINT Platform 2026.
Запуск: python scripts/verify_connections.py [--base-url URL]
"""

import argparse
import sys
import json
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode

BASE_URL = "http://localhost:8000"


def request(
    method: str,
    url: str,
    data: dict | None = None,
    headers: dict | None = None,
    form: bool = False,
) -> tuple[int, dict | str]:
    """Виконати HTTP запит, повернути (status_code, body)"""
    h = dict(headers or {})
    body_bytes = None
    if form and data:
        body_bytes = urlencode(data).encode()
        h.setdefault("Content-Type", "application/x-www-form-urlencoded")
    elif data is not None and not form:
        body_bytes = json.dumps(data).encode()
        h.setdefault("Content-Type", "application/json")
    req = Request(url, data=body_bytes, headers=h, method=method)
    try:
        with urlopen(req, timeout=10) as r:
            body = r.read().decode()
            try:
                return r.status, json.loads(body)
            except json.JSONDecodeError:
                return r.status, body
    except HTTPError as e:
        body = e.read().decode() if e.fp else ""
        try:
            return e.code, json.loads(body)
        except json.JSONDecodeError:
            return e.code, body
    except URLError as e:
        return -1, str(e.reason)
    except Exception as e:
        return -1, str(e)


def auth_headers(tok: str | None) -> dict:
    return {"Authorization": f"Bearer {tok}"} if tok else {}


def check(name: str, method: str, path: str, data: dict | None = None, expect: int = 200, token: str | None = None) -> bool:
    """Перевірити ендпоінт, вивести результат"""
    url = f"{BASE_URL}{path}"
    headers = auth_headers(token) if token else None
    status, body = request(method, url, data, headers)
    ok = status == expect
    symbol = "✓" if ok else "✗"
    exp_str = f" (очікувано {expect})" if not ok else ""
    print(f"  {symbol} {name}: {method} {path} -> {status}{exp_str}")
    if not ok and isinstance(body, (dict, str)):
        snippet = json.dumps(body)[:120] if isinstance(body, dict) else str(body)[:120]
        print(f"      Response: {snippet}...")
    return ok


def main():
    global BASE_URL
    parser = argparse.ArgumentParser(description="Verify API connections")
    parser.add_argument("--base-url", default="http://localhost:8000", help="API base URL")
    args = parser.parse_args()
    BASE_URL = args.base_url.rstrip("/")

    print(f"\n=== OSINT Platform 2026 — перевірка підключень ===\nBase URL: {BASE_URL}\n")

    passed = 0
    total = 0

    # Root
    total += 1
    if check("Root", "GET", "/"):
        passed += 1

    # Health
    total += 1
    if check("Health", "GET", "/health/"):
        passed += 1
    total += 1
    if check("Health live", "GET", "/health/live"):
        passed += 1
    total += 1
    if check("Health ready", "GET", "/health/ready"):
        passed += 1

    # Auth: register + login для отримання токена
    token = None
    total += 1
    s, reg = request("POST", f"{BASE_URL}/auth/register", {"username": "verify_user", "password": "verify_pass", "email": "verify@test.local"})
    if s in (200, 400):  # 400 = already registered
        passed += 1
        print(f"  ✓ Auth register: POST /auth/register -> {s}")
    else:
        print(f"  ✗ Auth register: POST /auth/register -> {s}")

    total += 1
    s, tok_body = request("POST", f"{BASE_URL}/auth/token", {"username": "verify_user", "password": "verify_pass"}, form=True)
    if s == 200 and isinstance(tok_body, dict):
        token = tok_body.get("access_token")
        passed += 1
        print(f"  ✓ Auth token: POST /auth/token -> 200")
    else:
        print(f"  ✗ Auth token: POST /auth/token -> {s}")

    # Tools
    total += 1
    if check("Tools catalog", "GET", "/tools/"):
        passed += 1
    total += 1
    if check("Tools stats", "GET", "/tools/stats"):
        passed += 1
    total += 1
    s, _ = request("POST", f"{BASE_URL}/tools/shodan/run", {"query": "8.8.8.8"})
    if s in (200, 202, 422):
        passed += 1
        print(f"  ✓ Tool run: POST /tools/shodan/run -> {s}")
    else:
        print(f"  ✗ Tool run: POST /tools/shodan/run -> {s}")
    total += 1

    # Tool status (mock task)
    s, _ = request("GET", f"{BASE_URL}/tools/status/mock_task_123")
    if s in (200, 404):
        passed += 1
        print(f"  ✓ Tool status: GET /tools/status/mock_task_123 -> {s}")
    else:
        print(f"  ✗ Tool status: GET /tools/status/mock_task_123 -> {s}")
    total += 1

    # Investigations (потрібен токен)
    inv_id = None
    if not token:
        print("  ⚠ Пропущено investigations/reports (немає токена)")
    else:
        total += 1
        s, body = request("POST", f"{BASE_URL}/investigations/", {"title": "Test", "target_identifier": "test"}, auth_headers(token))
        if s == 200 and isinstance(body, dict):
            inv_id = body.get("id")
            passed += 1
            print(f"  ✓ Create investigation: POST /investigations/ -> 200")
        else:
            print(f"  ✗ Create investigation: POST /investigations/ -> {s}")

        total += 1
        if check("List investigations", "GET", "/investigations/", token=token):
            passed += 1

        if inv_id:
            total += 1
            if check("Get investigation", "GET", f"/investigations/{inv_id}", token=token):
                passed += 1

            # Reports (auth optional, але inv має бути створений)
            total += 1
            s, _ = request("POST", f"{BASE_URL}/reports/{inv_id}/evidence", {
                "source": "Shodan",
                "data": json.dumps({"found": True, "host": "8.8.8.8"}),
                "target": "8.8.8.8"
            })
            if s == 200:
                passed += 1
                print(f"  ✓ Add evidence: POST /reports/{inv_id}/evidence -> 200")
            else:
                print(f"  ✗ Add evidence: POST /reports/{inv_id}/evidence -> {s}")

            total += 1
            if check("Get evidence", "GET", f"/reports/{inv_id}/evidence"):
                passed += 1

            total += 1
            s, _ = request("POST", f"{BASE_URL}/reports/{inv_id}/generate-report?format=json")
            if s == 200:
                passed += 1
                print(f"  ✓ Generate report: POST /reports/.../generate-report?format=json -> 200")
            else:
                print(f"  ✗ Generate report: POST /reports/.../generate-report?format=json -> {s}")

            total += 1
            if check("Report summary", "GET", f"/reports/{inv_id}/summary"):
                passed += 1

            # Vault STIX
            total += 1
            s, _ = request("GET", f"{BASE_URL}/vault/{inv_id}/export/stix")
            if s in (200, 404):
                passed += 1
                print(f"  ✓ Vault STIX: GET /vault/{inv_id}/export/stix -> {s}")
            else:
                print(f"  ✗ Vault STIX: GET /vault/{inv_id}/export/stix -> {s}")

    print(f"\n--- Підсумок: {passed}/{total} перевірок пройдено ---\n")
    sys.exit(0 if passed == total else 1)


if __name__ == "__main__":
    main()
