"""Pytest fixtures for OSINT Platform tests."""
import os
import pytest
import requests
import random
import string

API_URL = os.getenv("API_URL", "http://localhost:8000")


def _random_user():
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return {
        "username": f"pytest_{suffix}",
        "email": f"pytest_{suffix}@osint.local",
        "password": "TestPass123!",
    }


@pytest.fixture
def token():
    """Obtain JWT token via register + login."""
    user = _random_user()
    r = requests.post(f"{API_URL}/auth/register", json=user, timeout=10)
    assert r.status_code in (200, 201, 400), f"Register failed: {r.status_code} {r.text}"
    r = requests.post(
        f"{API_URL}/auth/token",
        data={"username": user["username"], "password": user["password"]},
        timeout=10,
    )
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]
