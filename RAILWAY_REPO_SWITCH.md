# Переключення Railway Worker на rsumko-sys/visual

Worker зараз підключений до `fzfw7ckckt-glitch/visual`, де немає `Dockerfile.worker`. Потрібно переключити на ваш форк.

## Кроки в Railway Dashboard

1. **Відкрити проект**  
   https://railway.com/dashboard → robust-kindness → production

2. **Відкрити сервіс worker**  
   Ліва панель → worker

3. **Settings → Source**  
   - Натиснути **Disconnect** (відключити поточний репо)  
   - Натиснути **Connect Repo**  
   - Обрати **rsumko-sys/visual**  
   - Branch: **main**

4. **Build settings**  
   - Root Directory: `.` (або порожньо)  
   - Dockerfile Path: `Dockerfile.worker`

5. **Deploy**  
   - Redeploy (або автоматично після збереження)

---

## Якщо потрібно зробити через API

Потрібен **Workspace** або **Account** token (Project token не має прав на `serviceConnect`).

```bash
# 1. Disconnect
curl -s -X POST https://backboard.railway.com/graphql/v2 \
  -H "Authorization: Bearer YOUR_WORKSPACE_OR_ACCOUNT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { serviceDisconnect(id: \"2ac77465-6c4c-4777-a322-0e2e5b4f5e19\") { id } }"}' | jq .

# 2. Connect to rsumko-sys/visual
curl -s -X POST https://backboard.railway.com/graphql/v2 \
  -H "Authorization: Bearer YOUR_WORKSPACE_OR_ACCOUNT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { serviceConnect(id: \"2ac77465-6c4c-4777-a322-0e2e5b4f5e19\", input: { repo: \"rsumko-sys/visual\", branch: \"main\" }) { id } }"}' | jq .

# 3. Redeploy
curl -s -X POST https://backboard.railway.com/graphql/v2 \
  -H "Project-Access-Token: d3b3f102-cfc0-4602-b36a-0c312b2db8ed" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { serviceInstanceRedeploy(serviceId: \"2ac77465-6c4c-4777-a322-0e2e5b4f5e19\", environmentId: \"8a369ab6-72d8-44c2-8b51-b731b00c29d0\") }"}' | jq .
```

Токен: https://railway.com/account/tokens
