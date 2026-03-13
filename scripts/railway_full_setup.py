#!/usr/bin/env python3
"""Railway Pro full setup via GraphQL API."""
import json
import subprocess
import sys
import time

TOKEN = "d3b3f102-cfc0-4602-b36a-0c312b2db8ed"
PROJECT_ID = "5ee64ab2-1677-47b5-86d5-4ea403bea2a6"
ENV_ID = "8a369ab6-72d8-44c2-8b51-b731b00c29d0"
WORKSPACE_ID = "e3b3615e-4f42-4b80-acfc-c0c0f3211fc2"
API_SERVICE_ID = "cb947afe-146e-4fee-aee5-c8eca85ca821"
DOSSIER_SERVICE_ID = "faecda4a-1553-4e75-8938-f774d3288825"
API_URL = "https://backboard.railway.com/graphql/v2"
API_DOMAIN = "https://robust-kindness-production.up.railway.app"


def gql(query: str, variables: dict | None = None) -> dict:
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    r = subprocess.run(
        [
            "curl", "-s", "-X", "POST", API_URL,
            "-H", f"Project-Access-Token: {TOKEN}",
            "-H", "Content-Type: application/json",
            "-d", json.dumps(payload),
        ],
        capture_output=True,
        text=True,
    )
    data = json.loads(r.stdout)
    if "errors" in data:
        print("GraphQL errors:", data["errors"], file=sys.stderr)
    return data


def main():
    print("==> 1. Domain already created: robust-kindness-production.up.railway.app")

    # Generate SECRET_KEY
    secret = subprocess.run(
        ["openssl", "rand", "-base64", "32"],
        capture_output=True,
        text=True,
    ).stdout.strip()

    print("==> 2. Setting API variables (SECRET_KEY, NEXT_PUBLIC_API_URL for dossier)...")

    # Set API variables - need DATABASE_URL and REDIS_URL
    # Without Postgres/Redis we use SQLite - but Celery needs Redis
    # Try variableCollectionUpsert with SECRET_KEY only first
    # Use references: ${{Postgres.DATABASE_URL}} if Postgres exists
    vars_api = {
        "SECRET_KEY": secret,
        "DATABASE_URL": "sqlite:///./osint.db",  # Fallback until Postgres added
        "REDIS_URL": "redis://localhost:6379/0",  # Fallback - worker won't work without Redis
        "CELERY_BROKER_URL": "redis://localhost:6379/0",
        "CELERY_RESULT_BACKEND": "redis://localhost:6379/1",
    }

    # Check EnvironmentVariables format
    r = gql("""
        mutation VariableUpsert($input: VariableCollectionUpsertInput!) {
            variableCollectionUpsert(input: $input)
        }
    """, {
        "input": {
            "projectId": PROJECT_ID,
            "environmentId": ENV_ID,
            "serviceId": API_SERVICE_ID,
            "variables": vars_api,
        },
    })
    if "errors" in r:
        print("Failed to set API vars:", r)
        return 1
    print("   API variables set.")

    # Set dossier NEXT_PUBLIC_API_URL
    r2 = gql("""
        mutation VariableUpsert($input: VariableCollectionUpsertInput!) {
            variableCollectionUpsert(input: $input)
        }
    """, {
        "input": {
            "projectId": PROJECT_ID,
            "environmentId": ENV_ID,
            "serviceId": DOSSIER_SERVICE_ID,
            "variables": {"NEXT_PUBLIC_API_URL": API_DOMAIN},
        },
    })
    if "errors" in r2:
        print("Failed to set dossier vars:", r2)
        return 1
    print("   Dossier NEXT_PUBLIC_API_URL set.")

    # Redeploy dossier (needs rebuild for NEXT_PUBLIC_*)
    print("==> 3. Redeploying dossier...")
    r3 = gql(
        'mutation { serviceInstanceRedeploy(serviceId: "%s", environmentId: "%s") }'
        % (DOSSIER_SERVICE_ID, ENV_ID)
    )
    if "errors" in r3:
        print("   Dossier redeploy:", r3.get("errors", []))
    else:
        print("   Dossier redeploy triggered.")

    # Redeploy API to pick up vars
    print("==> 4. Redeploying API...")
    r4 = gql(
        'mutation { serviceInstanceRedeploy(serviceId: "%s", environmentId: "%s") }'
        % (API_SERVICE_ID, ENV_ID)
    )
    if "errors" in r4:
        print("   API redeploy:", r4.get("errors", []))
    else:
        print("   API redeploy triggered.")

    print("\n=== Summary ===")
    print("API URL:", API_DOMAIN)
    print("Dossier: https://dossier-production-871b.up.railway.app")
    print("\n⚠️  Add Postgres + Redis from Railway Dashboard (+ New → Database)")
    print("   Then update API variables: DATABASE_URL, REDIS_URL, CELERY_*")
    print("   Use references: ${{Postgres.DATABASE_URL}} and ${{Redis.REDIS_URL}}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
