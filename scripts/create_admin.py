#!/usr/bin/env python3
"""
Створення адмін-користувача через API.
Використання: API_URL=https://your-api.railway.app python3 scripts/create_admin.py
"""

import os
import secrets
import string
import sys

try:
    import requests
except ImportError:
    print("pip install requests")
    sys.exit(1)

BASE = os.getenv("API_URL", "http://localhost:8000").rstrip("/")
USERNAME = "admin"
EMAIL = "admin@localhost"


def gen_password(length: int = 16) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def main():
    password = gen_password()
    print(f"\n=== Створення адмін-користувача ===\nAPI: {BASE}\n")

    r = requests.post(
        f"{BASE}/auth/register",
        json={"username": USERNAME, "email": EMAIL, "password": password},
        timeout=15,
    )

    if r.status_code in (200, 201):
        print(f"   ✓ Користувача '{USERNAME}' створено\n")
        print("   Логін:    ", USERNAME)
        print("   Пароль:   ", password)
        print("\n   Збережіть пароль — він більше не показуватиметься.\n")
        return 0

    if r.status_code == 400:
        detail = r.json().get("detail", "Username already registered")
        print(f"   ⚠ Користувач '{USERNAME}' вже існує.")
        print("   Використовуйте існуючий пароль або скиньте його в БД.\n")
        return 1

    print(f"   ✗ Помилка {r.status_code}: {r.text[:200]}\n")
    return 1


if __name__ == "__main__":
    sys.exit(main())
