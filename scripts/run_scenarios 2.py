#!/usr/bin/env python3
"""
Сценарії використання OSINT Platform 2026.
Перевірка найбільш вірогідних шляхів користувача.
"""

import json
import sys
import time
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode

BASE = "http://localhost:8000"


def req(method: str, path: str, data=None, headers=None, form=False):
    url = f"{BASE}{path}"
    h = dict(headers or {})
    body = None
    if form and data:
        body = urlencode(data).encode()
        h.setdefault("Content-Type", "application/x-www-form-urlencoded")
    elif data is not None:
        body = json.dumps(data).encode()
        h.setdefault("Content-Type", "application/json")
    r = Request(url, data=body, headers=h, method=method)
    try:
        with urlopen(r, timeout=15) as resp:
            return resp.status, json.loads(resp.read().decode())
    except HTTPError as e:
        b = e.read().decode() if e.fp else ""
        try:
            return e.code, json.loads(b)
        except Exception:
            return e.code, {"raw": b}
    except Exception as e:
        return -1, {"error": str(e)}


def main():
    issues = []
    print("\n=== Сценарії використання OSINT Platform 2026 ===\n")

    # --- Сценарій 1: Реєстрація та вхід ---
    print("1. Реєстрація та вхід")
    s, _ = req("POST", "/auth/register", {"username": "scenario_user", "password": "pass123", "email": "s@test.local"})
    if s not in (200, 400):
        issues.append("Реєстрація: очікувано 200/400, отримано " + str(s))
    else:
        print("   ✓ Реєстрація OK")

    s, tok = req("POST", "/auth/token", {"username": "scenario_user", "password": "pass123"}, form=True)
    if s != 200:
        issues.append("Логін: очікувано 200, отримано " + str(s))
        print("   ✗ Логін не вдався")
        sys.exit(1)
    token = tok.get("access_token")
    print("   ✓ Логін OK")

    auth = {"Authorization": f"Bearer {token}"}

    # --- Сценарій 2: Створення розслідування ---
    print("\n2. Створення розслідування")
    s, inv = req("POST", "/investigations/", {"title": "Test OSINT", "target_identifier": "8.8.8.8"}, auth)
    if s != 200:
        issues.append("Створення investigation: " + str(s))
        print("   ✗ Помилка")
    else:
        inv_id = inv.get("id")
        print(f"   ✓ Investigation {inv_id[:8]}...")

    # --- Сценарій 3: Запуск інструменту (mock) ---
    print("\n3. Запуск інструменту Shodan")
    s, run = req("POST", "/tools/shodan/run", {"query": "8.8.8.8", "investigation_id": inv_id})
    if s in (200, 202):
        task_id = run.get("task_id", "")
        print(f"   ✓ Task: {task_id[:20]}...")
    else:
        issues.append("Tool run: " + str(s))
        print("   ✗ Помилка запуску")

    # --- Сценарій 4: Полінг статусу ---
    print("\n4. Полінг статусу задачі")
    task_id = run.get("task_id", "mock_task_123")
    # Якщо mock — одразу ready; якщо Celery — чекаємо до 5 сек
    for _ in range(6):
        s, status = req("GET", f"/tools/status/{task_id}")
        if s != 200:
            issues.append("Status: " + str(s))
            print("   ✗ Помилка")
            break
        if status.get("ready"):
            print("   ✓ Ready, result:", str(status.get("result", {}))[:60] + "...")
            break
        time.sleep(1)
    else:
        issues.append("Status: ready=False після 5 сек (Celery/Redis?)")
        print("   ⚠ Task не завершився (Redis/Celery?)")

    # --- Сценарій 5: Додавання доказів ---
    print("\n5. Додавання доказів до Evidence Vault")
    s, _ = req("POST", f"/reports/{inv_id}/evidence", {
        "source": "Shodan",
        "data": json.dumps({"found": True, "host": "8.8.8.8"}),
        "target": "8.8.8.8"
    })
    if s != 200:
        issues.append("Add evidence: " + str(s))
        print("   ✗ Помилка")
    else:
        print("   ✓ Evidence додано")

    # --- Сценарій 6: Генерація звіту ---
    print("\n6. Генерація звіту (JSON)")
    s, report = req("POST", f"/reports/{inv_id}/generate-report?format=json")
    if s != 200:
        issues.append("Generate report: " + str(s))
        print("   ✗ Помилка")
    else:
        sections = report.get("sections", [])
        print(f"   ✓ Звіт: {len(sections)} секцій")

    # --- Сценарій 7: PDF звіт ---
    print("\n7. Генерація PDF звіту")
    url = f"{BASE}/reports/{inv_id}/generate-report?format=pdf"
    r = Request(url, data=None, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urlopen(r, timeout=15) as resp:
            pdf_len = len(resp.read())
            if pdf_len > 100:
                print(f"   ✓ PDF: {pdf_len} bytes")
            else:
                issues.append("PDF занадто малий")
                print("   ⚠ PDF малий")
    except Exception as e:
        issues.append("PDF: " + str(e))
        print("   ✗ Помилка PDF")

    # --- Сценарій 8: Експорт STIX ---
    print("\n8. Експорт STIX")
    s, stix = req("GET", f"/vault/{inv_id}/export/stix")
    if s != 200:
        issues.append("STIX: " + str(s))
        print("   ✗ Помилка")
    else:
        objs = stix.get("objects", [])
        print(f"   ✓ STIX bundle: {len(objs)} об'єктів")

    # --- Підсумок ---
    print("\n" + "=" * 50)
    if issues:
        print("Знайдено проблеми:")
        for i in issues:
            print("  -", i)
        sys.exit(1)
    else:
        print("Усі сценарії пройдено успішно.")
        sys.exit(0)


if __name__ == "__main__":
    main()
