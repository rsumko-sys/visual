#!/usr/bin/env python3
"""Railway Pro complete setup: Redis, update API vars, create Worker."""
import json
import subprocess
import sys

TOKEN = "d3b3f102-cfc0-4602-b36a-0c312b2db8ed"
PROJECT_ID = "5ee64ab2-1677-47b5-86d5-4ea403bea2a6"
ENV_ID = "8a369ab6-72d8-44c2-8b51-b731b00c29d0"
WORKSPACE_ID = "e3b3615e-4f42-4b80-acfc-c0c0f3211fc2"
API_SERVICE_ID = "cb947afe-146e-4fee-aee5-c8eca85ca821"
DOSSIER_SERVICE_ID = "faecda4a-1553-4e75-8938-f774d3288825"
API_URL = "https://backboard.railway.com/graphql/v2"
API_DOMAIN = "https://robust-kindness-production.up.railway.app"

REDIS_TEMPLATE_ID = "895cb7c9-8ea9-4407-b4b6-b5013a65145e"


def gql(query: str, variables: dict | None = None) -> dict:
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    r = subprocess.run(
        ["curl", "-s", "-X", "POST", API_URL, "-H", f"Project-Access-Token: {TOKEN}",
         "-H", "Content-Type: application/json", "-d", json.dumps(payload)],
        capture_output=True, text=True,
    )
    return json.loads(r.stdout)


def main():
    print("==> 1. Deploying Redis...")
    redis_cfg = {
        "services": {
            "0c02a040-57ef-4e8a-8054-a74d2ff13029": {
                "name": "Redis",
                "deploy": {"startCommand": "/bin/sh -c \"rm -rf $RAILWAY_VOLUME_MOUNT_PATH/lost+found/ && exec docker-entrypoint.sh redis-server --requirepass $REDIS_PASSWORD --save 60 1 --dir $RAILWAY_VOLUME_MOUNT_PATH\""},
                "source": {"image": "redis:8.2.1"},
                "variables": {
                    "REDISHOST": {"defaultValue": "${{RAILWAY_PRIVATE_DOMAIN}}"},
                    "REDISPORT": {"defaultValue": "6379"},
                    "REDISUSER": {"defaultValue": "default"},
                    "REDIS_URL": {"defaultValue": "redis://${{ REDISUSER }}:${{ REDIS_PASSWORD }}@${{ REDISHOST }}:${{ REDISPORT }}"},
                    "REDIS_PASSWORD": {"defaultValue": "${{ secret(32, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') }}"},
                },
                "networking": {"tcpProxies": {"6379": {}}},
                "volumeMounts": {"0c02a040-57ef-4e8a-8054-a74d2ff13029": {"mountPath": "/data"}},
            }
        }
    }
    r = gql("""
        mutation TemplateDeploy($input: TemplateDeployV2Input!) {
            templateDeployV2(input: $input) { projectId workflowId }
        }
    """, {"input": {
        "templateId": REDIS_TEMPLATE_ID,
        "projectId": PROJECT_ID,
        "environmentId": ENV_ID,
        "workspaceId": WORKSPACE_ID,
        "serializedConfig": redis_cfg,
    }})
    if r.get("errors"):
        print("   Redis deploy (may fail if project token lacks permission):", r["errors"][0].get("message", r["errors"]))
    else:
        print("   Redis deploy triggered.")

    print("\n==> 2. Updating API variables (Postgres + Redis refs)...")
    secret = subprocess.run(["openssl", "rand", "-base64", "32"], capture_output=True, text=True).stdout.strip()
    vars_api = {
        "SECRET_KEY": secret,
        "DATABASE_URL": "${{Postgres.DATABASE_URL}}",
        "REDIS_URL": "${{Redis.REDIS_URL}}",
        "CELERY_BROKER_URL": "${{Redis.REDIS_URL}}",
        "CELERY_RESULT_BACKEND": "${{Redis.REDIS_URL}}",
    }

    r2 = gql("""
        mutation VariableUpsert($input: VariableCollectionUpsertInput!) {
            variableCollectionUpsert(input: $input)
        }
    """, {"input": {
        "projectId": PROJECT_ID, "environmentId": ENV_ID, "serviceId": API_SERVICE_ID,
        "variables": vars_api,
    }})
    if r2.get("errors"):
        print("   API vars (refs may fail if Postgres/Redis named differently):", r2["errors"][0].get("message", ""))
        # Try without refs - user will set manually
        vars_fallback = {
            "SECRET_KEY": secret,
            "DATABASE_URL": "${{Postgres.DATABASE_URL}}",
        }
        gql("""
            mutation VariableUpsert($input: VariableCollectionUpsertInput!) {
                variableCollectionUpsert(input: $input)
            }
        """, {"input": {"projectId": PROJECT_ID, "environmentId": ENV_ID, "serviceId": API_SERVICE_ID, "variables": vars_fallback}})
    else:
        print("   API variables updated.")

    print("\n==> 3. Redeploying API...")
    gql('mutation { serviceInstanceRedeploy(serviceId: "%s", environmentId: "%s") }' % (API_SERVICE_ID, ENV_ID))

    print("\n=== Done ===")
    print("API:", API_DOMAIN)
    print("Dossier: https://dossier-production-871b.up.railway.app")
    print("\n⚠️  Add Worker manually: Railway → + New → GitHub Repo → select worker/Dockerfile")
    print("   Or: + New → Empty → Connect repo → set rootDirectory=worker (if supported)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
