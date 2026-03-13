# Додавання Web-сервісу на Railway

## 1. Створити новий сервіс

1. Відкрий [Railway Dashboard](https://railway.com/project/5ee64ab2-1677-47b5-86d5-4ea403bea2a6)
2. Натисни **+ New** → **Empty Service**
3. Назви сервіс **dossier** (ПКМ → Rename)

## 2. Налаштувати Root Directory

1. Відкрий **dossier** сервіс → **Settings**
2. **Root Directory** → вкажи `web`
3. Збережи (Deploy / ⇧ Enter)

## 3. Підключити репозиторій

1. У **Settings** сервісу dossier → **Source**
2. Обери **Connect Repo** → GitHub → репо `visual` (або твій fork)
3. Branch: `main` або `config-sqlite`

## 4. Змінні середовища

1. **dossier** сервіс → **Variables**
2. Додай:
   ```
   NEXT_PUBLIC_API_URL = https://<твій-api-domain>.railway.app
   ```
   Замість `<твій-api-domain>` — домен API-сервісу (Settings → Generate Domain).

## 5. Домен для dossier

1. **dossier** сервіс → **Settings** → **Generate Domain**
2. Railway видасть URL типу `dossier-production-xxxx.up.railway.app`

## 6. Деплой через CLI (опційно)

Після створення dossier-сервісу:

```bash
cd /Users/admin/Desktop/int-main\ 2
export RAILWAY_TOKEN=d3b3f102-cfc0-4602-b36a-0c312b2db8ed
railway up --project 5ee64ab2-1677-47b5-86d5-4ea403bea2a6 --environment production --service <DOSSIER_SERVICE_ID>
```

`DOSSIER_SERVICE_ID` — ID dossier-сервісу з URL у Dashboard (наприклад, `railway.com/project/.../service/XXXXXXXX`).
