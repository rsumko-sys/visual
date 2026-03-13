#!/usr/bin/env python3
"""Додати тільки ALLOWED_PASSWORDS до API (без зміни інших змінних)."""
import json
import subprocess

TOKEN = "d3b3f102-cfc0-4602-b36a-0c312b2db8ed"
PROJECT_ID = "5ee64ab2-1677-47b5-86d5-4ea403bea2a6"
ENV_ID = "8a369ab6-72d8-44c2-8b51-b731b00c29d0"
API_SERVICE_ID = "cb947afe-146e-4fee-aee5-c8eca85ca821"
API_URL = "https://backboard.railway.com/graphql/v2"
PASSWORD = 'mJ9:fqQ?ptP3"jjT2)zoU4$qcC7<nn'

payload = {
    "query": "mutation($input: VariableUpsertInput!) { variableUpsert(input: $input) }",
    "variables": {
        "input": {
            "projectId": PROJECT_ID,
            "environmentId": ENV_ID,
            "serviceId": API_SERVICE_ID,
            "name": "ALLOWED_PASSWORDS",
            "value": PASSWORD,
        }
    },
}
r = subprocess.run(
    ["curl", "-s", "-X", "POST", API_URL, "-H", f"Project-Access-Token: {TOKEN}",
     "-H", "Content-Type: application/json", "-d", json.dumps(payload)],
    capture_output=True, text=True,
)
data = json.loads(r.stdout)
if data.get("errors"):
    print("FAIL:", data["errors"])
else:
    print("OK: ALLOWED_PASSWORDS set. Wait 1-2 min for API redeploy.")
