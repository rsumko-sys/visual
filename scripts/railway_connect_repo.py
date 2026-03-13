#!/usr/bin/env python3
"""Підключити API, Worker, Dossier до rsumko-sys/visual та redeploy."""
import json
import subprocess
import sys

TOKEN = "d3b3f102-cfc0-4602-b36a-0c312b2db8ed"
ENV_ID = "8a369ab6-72d8-44c2-8b51-b731b00c29d0"
API_SERVICE_ID = "cb947afe-146e-4fee-aee5-c8eca85ca821"
WORKER_SERVICE_ID = "2ac77465-6c4c-4777-a322-0e2e5b4f5e19"
DOSSIER_SERVICE_ID = "faecda4a-1553-4e75-8938-f774d3288825"
REPO = "rsumko-sys/visual"
API_URL = "https://backboard.railway.com/graphql/v2"


def gql(query: str, variables: dict | None = None) -> dict:
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    r = subprocess.run(
        ["curl", "-s", "-X", "POST", API_URL, "-H", f"Project-Access-Token: {TOKEN}",
         "-H", "Content-Type: application/json", "-d", json.dumps(payload)],
        capture_output=True, text=True,
    )
    data = json.loads(r.stdout)
    if data.get("errors"):
        print("GraphQL errors:", data["errors"], file=sys.stderr)
    return data


def main():
    print("==> 1. Source → rsumko-sys/visual (API, Worker, Dossier)")
    updates = [
        (API_SERVICE_ID, {"source": {"repo": REPO}, "rootDirectory": ""}),
        (WORKER_SERVICE_ID, {"source": {"repo": REPO}, "rootDirectory": "", "dockerfilePath": "Dockerfile.worker"}),
        (DOSSIER_SERVICE_ID, {"source": {"repo": REPO}, "rootDirectory": "web"}),
    ]
    for sid, inp in updates:
        r = gql("""
            mutation ServiceUpdate($eid: String!, $sid: String!, $inp: ServiceInstanceUpdateInput!) {
                serviceInstanceUpdate(environmentId: $eid, serviceId: $sid, input: $inp)
            }
        """, {"eid": ENV_ID, "sid": sid, "inp": inp})
        ok = not r.get("errors")
        print(f"   {sid[:8]}... ", "OK" if ok else r.get("errors"))

    print("\n==> 2. Redeploy")
    for sid in [API_SERVICE_ID, WORKER_SERVICE_ID, DOSSIER_SERVICE_ID]:
        r = gql('mutation { serviceInstanceRedeploy(serviceId: "%s", environmentId: "%s") }' % (sid, ENV_ID))
        ok = r.get("data", {}).get("serviceInstanceRedeploy")
        print(f"   {sid[:8]}... ", "OK" if ok else r)

    print("\n=== Done. Wait 2–3 min, then: curl https://robust-kindness-production.up.railway.app/auth/guest")


if __name__ == "__main__":
    sys.exit(main() or 0)
