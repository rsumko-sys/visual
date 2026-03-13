
import requests
import json
import random
import string

API_URL = "http://localhost:8000"

def random_user():
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return {
        "username": f"testuser_{suffix}",
        "email": f"test_{suffix}@osint.local",
        "password": "TestPass123!"
    }

def get_token():
    user = random_user()
    # Register
    r = requests.post(f"{API_URL}/auth/register", json=user)
    assert r.status_code == 200 or r.status_code == 201 or (r.status_code == 400 and "already registered" in r.text)
    # Login
    r = requests.post(f"{API_URL}/auth/token", data={"username": user["username"], "password": user["password"]})
    assert r.status_code == 200
    return r.json()["access_token"]

def test_tools_endpoints():
    r = requests.get(f"{API_URL}/tools/")
    assert r.status_code == 200
    data = r.json()
    assert "total_tools" in data
    assert data["total_tools"] > 0
    print("Tools list OK")

    r = requests.get(f"{API_URL}/tools/category/SOCMINT")
    assert r.status_code == 200
    print("Category filter OK")

    r = requests.get(f"{API_URL}/tools/search/maigret")
    assert r.status_code == 200
    print("Tool search OK")

def test_vault_stix(token):
    # Create investigation
    inv = requests.post(f"{API_URL}/investigations/", json={
        "title": "Test Case",
        "description": "Test Desc",
        "target_identifier": "testuser"
    }, headers={"Authorization": f"Bearer {token}"})
    assert inv.status_code == 200 or inv.status_code == 201
    inv_id = inv.json()["id"]

    # Store evidence
    r = requests.post(f"{API_URL}/vault/store", data={
        "investigation_id": inv_id,
        "source": "test_tool",
        "data": "test_data"
    })
    assert r.status_code == 200
    print("Evidence store OK")

    # Export STIX
    r = requests.get(f"{API_URL}/vault/{inv_id}/export/stix")
    assert r.status_code == 200
    stix = r.json()
    assert stix["type"] == "bundle"
    print("STIX export OK")

def test_reports_pdf(token):
    # Create investigation
    inv = requests.post(f"{API_URL}/investigations/", json={
        "title": "PDF Case",
        "description": "PDF Desc",
        "target_identifier": "pdfuser"
    }, headers={"Authorization": f"Bearer {token}"})
    assert inv.status_code == 200 or inv.status_code == 201
    inv_id = inv.json()["id"]

    # Generate PDF
    r = requests.post(f"{API_URL}/reports/{inv_id}/generate-report?format=pdf")
    assert r.status_code == 200
    print("PDF report OK")

def test_task_status():
    r = requests.post(f"{API_URL}/tools/maigret/run", json={
        "query": "testuser",
        "investigation_id": "test123",
        "api_key": ""
    })
    assert r.status_code == 200
    task_id = r.json()["task_id"]
    r = requests.get(f"{API_URL}/tools/status/{task_id}")
    assert r.status_code == 200
    print("Task status OK")

if __name__ == "__main__":
    test_tools_endpoints()
    token = get_token()
    test_vault_stix(token)
    test_reports_pdf(token)
    test_task_status()
    print("All subsystem tests passed!")
