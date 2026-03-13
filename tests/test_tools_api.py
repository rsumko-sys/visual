import pytest
import requests

API_URL = "http://localhost:8000"


@pytest.mark.parametrize("tool_id", ["shodan", "maigret_v3"])
def test_tool_run(tool_id):
    r = requests.post(f"{API_URL}/tools/{tool_id}/run", json={
        "query": "test_query",
        "investigation_id": "testcase",
        "api_key": "demo"
    }, timeout=10)
    assert r.status_code == 200, f"{tool_id}: {r.status_code} {r.text}"
    data = r.json()
    assert "task_id" in data
    assert data.get("status") in ("queued", "mocked_success")


@pytest.mark.parametrize("category", ["SOCMINT", "SIGINT", "GEOINT"])
def test_category(category):
    r = requests.get(f"{API_URL}/tools/category/{category}", timeout=10)
    assert r.status_code == 200, f"{category}: {r.status_code} {r.text}"
    data = r.json()
    assert "tools" in data or "name" in data
