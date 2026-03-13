# Підключення Railway до форку (rsumko-sys/visual)

Щоб API і dossier деплоїлись з нашими виправленнями:

## 1. API (robust-kindness)

1. Відкрий [Railway Dashboard](https://railway.app) → проєкт → **robust-kindness**
2. **Settings** → **Source** → **Disconnect** (якщо підключено)
3. **Connect Repo** → **GitHub** → обери **rsumko-sys/visual**
4. **Branch:** `config-sqlite`
5. **Root Directory:** `.` (корінь)
6. **Dockerfile Path:** `Dockerfile.api` (для API)
7. Збережи — Railway автоматично запустить deploy

## 2. Dossier

1. **dossier** → **Settings** → **Source**
2. Аналогічно: **rsumko-sys/visual**, гілка **config-sqlite**
3. **Root Directory:** `web`
4. Збережи

## 3. Після деплою

```bash
./scripts/register_admin.sh
```

Логін: `admin`, пароль: `1488`
