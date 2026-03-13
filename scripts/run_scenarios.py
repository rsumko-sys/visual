#!/usr/bin/env python3
"""
Сценарії використання OSINT Platform 2026.
Перевірка найбільш вірогідних шляхів користувача.
"""

import json
import os
import sys
import time

try:
    import requests
except ImportError:
    print("pip install requests")
    sys.exit(1)

BASE = os.getenv("API_URL", "http://localhost:8000").rstrip("/")


def req(method: str, path: str, data=None, headers=None, form=False):
    url = f"{BASE}{path}"
    h = dict(headers or {})
    if form and data:
        r = requests.request(method, url, data=data, headers=h, timeout=15)
    elif data is not None:
        r = requests.request(method, url, json=data, headers=h, timeout=15)
    else:
        r = requests.request(method, url, headers=h, timeout=15)
    try:
        return r.status_code, r.json()
    except Exception:
        return r.status_code, {"raw": r.text}


def main():
    issues = []
    suffix = str(int(time.time()))[-6:]
    user = f"scenario_{suffix}"
    pwd = "TestPass123!"
    print(f"\n=== Сценарії використання OSINT Platform 2026 ===\nBASE={BASE}\n")

    # --- Сценарій 1: Реєстрація та вхід ---
    print("1. Реєстрація та вхід")
    s, _ = req("POST", "/auth/register", {"username": user, "password": pwd, "email": f"{user}@test.local"})
    if s not in (200, 201, 400):
        issues.append("Реєстрація: очікувано 200/201/400, отримано " + str(s))
        print(f"   ✗ Реєстрація {s}")
    else:
        print("   ✓ Реєстрація OK")

    s, tok = req("POST", "/auth/token", {"username": user, "password": pwd}, form=True)
    if s != 200:
        issues.append("Логін: очікувано 200, отримано " + str(s))
        print(f"   ✗ Логін не вдався: {s} {tok}")
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
    s, run = req("POST", "/tools/shodan/run", {"query": "8.8.8.8", "investigation_id": inv_id}, auth)
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
        s, status = req("GET", f"/tools/status/{task_id}", headers=auth)
        if s != 200:
            issues.append("Status: " + str(s))
            print("   ✗ Помилка")
            break
        if status.get("ready"):
            print("   ✓ Ready, result:", str(status.get("result", {}))[:60] + "...")
            break
        time.sleep(1)
    else:
        print("   ⚠ Task не завершився за 5 сек (Worker може обробляти асинхронно)")

    # --- Сценарій 5: Додавання доказів ---
    print("\n5. Додавання доказів до Evidence Vault")
    s, _ = req("POST", f"/reports/{inv_id}/evidence", {
        "source": "Shodan",
        "data": json.dumps({"found": True, "host": "8.8.8.8"}),
        "target": "8.8.8.8"
    }, auth)
    if s != 200:
        issues.append("Add evidence: " + str(s))
        print("   ✗ Помилка")
    else:
        print("   ✓ Evidence додано")

    # --- Сценарій 6: Генерація звіту ---
    print("\n6. Генерація звіту (JSON)")
    s, report = req("POST", f"/reports/{inv_id}/generate-report?format=json", {}, auth)
    if s != 200:
        issues.append("Generate report: " + str(s))
        print("   ✗ Помилка")
    else:
        sections = report.get("sections", [])
        print(f"   ✓ Звіт: {len(sections)} секцій")

    # --- Сценарій 7: PDF звіт ---
    print("\n7. Генерація PDF звіту")
    try:
        r = requests.post(f"{BASE}/reports/{inv_id}/generate-report?format=pdf", headers=auth, timeout=15)
        pdf_len = len(r.content)
        if r.status_code == 200 and pdf_len > 100:
            print(f"   ✓ PDF: {pdf_len} bytes")
        elif r.status_code == 200:
            print("   ⚠ PDF малий (можливо порожній звіт)")
        else:
            issues.append(f"PDF: {r.status_code}")
            print(f"   ✗ PDF {r.status_code}")
    except Exception as e:
        issues.append("PDF: " + str(e))
        print("   ✗ Помилка PDF")

    # --- Сценарій 8: Експорт STIX ---
    print("\n8. Експорт STIX")
    s, stix = req("GET", f"/vault/{inv_id}/export/stix", headers=auth)
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
