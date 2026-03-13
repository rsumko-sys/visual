# Підключення Railway до форку (rsumko-sys/visual)

Щоб API і dossier деплоїлись з нашими виправленнями:

## Перевірка підключення Git

1. Відкрий [Railway Dashboard](https://railway.app)
2. Обери проєкт (robust-kindness)
3. **API сервіс** → **Settings** → **Source**:
   - **Repository:** має бути `rsumko-sys/visual` (не fzfw7ckckt-glitch/visual)
   - **Branch:** `main`
   - **Root Directory:** `.` (корінь)
4. **Dossier сервіс** → **Settings** → **Source**:
   - **Repository:** `rsumko-sys/visual`
   - **Branch:** `main`
   - **Root Directory:** `web`

Якщо підключено інший репо — натисни **Disconnect**, потім **Connect Repo** → GitHub → **rsumko-sys/visual**.

## 1. API (robust-kindness)

1. **Settings** → **Source** → **Connect Repo** → **rsumko-sys/visual**
2. **Branch:** `main`
3. **Root Directory:** `.`
4. **Dockerfile Path:** `Dockerfile.api`
5. Збережи — Railway автоматично запустить deploy

## 2. Dossier

1. **Settings** → **Source** → **rsumko-sys/visual**
2. **Branch:** `main`
3. **Root Directory:** `web`
4. Збережи

## 3. Перевірка після деплою

```bash
curl https://robust-kindness-production.up.railway.app/auth/guest
# Має повернути: {"access_token":"...","token_type":"bearer"}
```
