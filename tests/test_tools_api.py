import requests

API_URL = "http://localhost:8000"

def test_tool(tool_id):
    r = requests.post(f"{API_URL}/tools/{tool_id}/run", json={
        "query": "test_query",
        "investigation_id": "testcase",
        "api_key": "demo"
    })
    print(f"{tool_id}: ", r.status_code, r.json())

def test_category(category):
    r = requests.get(f"{API_URL}/tools/category/{category}")
    print(f"Category {category}: ", r.status_code, r.json())

if __name__ == "__main__":
    # Test tool search/run
    test_tool("recordedfuture")
    test_tool("clearviewai")
    # Test category filtering
    for cat in ["IMINT", "CRYPTOINT", "DEEPFAKE"]:
        test_category(cat)
