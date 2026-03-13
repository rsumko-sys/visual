# Worker: Could not find root directory

**Помилка:** `Could not find root directory: rsumko-sys/visual → branch main`

**Причина:** Railway не має доступу до репо (GitHub App) або Root Directory вказано некоректно.

## 1. Дати Railway доступ до репо

Railway показує "No repositories found" — потрібно дозволити доступ:

- **GitHub** → **Settings** (акаунту або організації) → **Applications** → **Installed GitHub Apps** → **Railway** → **Configure**
- У **Repository access** додати **fzfw7ckckt-glitch/visual** (або "All repositories")
- Зберегти

## 2. Налаштування worker в Railway

1. **worker** → **Settings** → **Source**
2. **Disconnect** (від поточного репо)
3. **Connect Repo** → пошук **fzfw7ckckt-glitch/visual** (після кроку 1 має зʼявитися)
4. Branch: **main**
5. **Root Directory:** очистити поле (залишити порожнім або `.`) — не `rsumko-sys/visual`!
6. **Build** → **Dockerfile Path:** `Dockerfile.worker`
7. Зберегти — Railway запустить deploy

---

**Альтернатива:** Якщо є **Workspace token** (railway.com/account/tokens):

```bash
# 1. Disconnect
curl -s -X POST https://backboard.railway.com/graphql/v2 \
  -H "Authorization: Bearer YOUR_WORKSPACE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { serviceDisconnect(id: \"2ac77465-6c4c-4777-a322-0e2e5b4f5e19\") { id } }"}' | jq .

# 2. Connect to fzfw7ckckt-glitch/visual
curl -s -X POST https://backboard.railway.com/graphql/v2 \
  -H "Authorization: Bearer YOUR_WORKSPACE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { serviceConnect(id: \"2ac77465-6c4c-4777-a322-0e2e5b4f5e19\", input: { repo: \"fzfw7ckckt-glitch/visual\", branch: \"main\" }) { id } }"}' | jq .
```
