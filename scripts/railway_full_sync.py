#!/usr/bin/env python3
"""
Railway Full Sync — налаштування всіх сервісів з урахуванням залежностей.
Не змінює одне без огляду на інше.

Порядок: 1) Змінні для всіх, 2) Source/root для всіх, 3) Redeploy.
"""
import json
import subprocess
import sys

TOKEN = "d3b3f102-cfc0-4602-b36a-0c312b2db8ed"
PROJECT_ID = "5ee64ab2-1677-47b5-86d5-4ea403bea2a6"
ENV_ID = "8a369ab6-72d8-44c2-8b51-b731b00c29d0"
API_SERVICE_ID = "cb947afe-146e-4fee-aee5-c8eca85ca821"
WORKER_SERVICE_ID = "2ac77465-6c4c-4777-a322-0e2e5b4f5e19"
DOSSIER_SERVICE_ID = "faecda4a-1553-4e75-8938-f774d3288825"
API_DOMAIN = "https://robust-kindness-production.up.railway.app"
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
    secret = subprocess.run(
        ["openssl", "rand", "-base64", "32"],
        capture_output=True, text=True,
    ).stdout.strip()

    print("==> 1. Variables (API + Worker)")
    vars_shared = {
        "SECRET_KEY": secret,
        "JWT_SECRET_KEY": secret,
        "DATABASE_URL": "sqlite:///./osint.db",
        "REDIS_URL": "${{Redis.REDIS_URL}}",
        "CELERY_BROKER_URL": "${{Redis.REDIS_URL}}",
        "CELERY_RESULT_BACKEND": "${{Redis.REDIS_URL}}",
        "RAILWAY_HEALTHCHECK_TIMEOUT_SEC": "180",
    }
    for sid, name in [(API_SERVICE_ID, "API"), (WORKER_SERVICE_ID, "Worker")]:
        r = gql("""
            mutation VariableUpsert($input: VariableCollectionUpsertInput!) {
                variableCollectionUpsert(input: $input)
            }
        """, {"input": {"projectId": PROJECT_ID, "environmentId": ENV_ID, "serviceId": sid, "variables": vars_shared}})
        if r.get("errors"):
            print(f"   {name} vars FAIL:", r["errors"])
        else:
            print(f"   {name} vars OK")

    print("\n==> 2. Dossier variables")
    r = gql("""
        mutation VariableUpsert($input: VariableCollectionUpsertInput!) {
            variableCollectionUpsert(input: $input)
        }
    """, {"input": {"projectId": PROJECT_ID, "environmentId": ENV_ID, "serviceId": DOSSIER_SERVICE_ID,
                     "variables": {"NEXT_PUBLIC_API_URL": API_DOMAIN}}})
    print("   Dossier vars OK" if not r.get("errors") else f"   Dossier FAIL: {r['errors']}")

    print("\n==> 3. Source + rootDirectory (repo, root, dockerfile)")
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
        print(f"   {sid[:8]}... update:", "OK" if not r.get("errors") else r.get("errors"))

    print("\n==> 4. Redeploy (API, Worker, Dossier)")
    for sid in [API_SERVICE_ID, WORKER_SERVICE_ID, DOSSIER_SERVICE_ID]:
        r = gql('mutation { serviceInstanceRedeploy(serviceId: "%s", environmentId: "%s") }' % (sid, ENV_ID))
        print("   Redeploy OK" if r.get("data", {}).get("serviceInstanceRedeploy") else f"   Redeploy: {r}")

    print("\n=== Done. Wait 2–3 min, then: curl", API_DOMAIN + "/health/")


if __name__ == "__main__":
    sys.exit(main() or 0)
