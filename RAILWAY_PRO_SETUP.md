# Railway Pro — повне налаштування OSINT Platform

## Автоматично зроблено (через API)

- [x] Домен API: **https://robust-kindness-production.up.railway.app**
- [x] Змінні API: SECRET_KEY, DATABASE_URL (${{Postgres.DATABASE_URL}}), REDIS_URL (${{Redis.REDIS_URL}})
- [x] Змінні dossier: NEXT_PUBLIC_API_URL
- [x] Redeploy обох сервісів

## Чекліст (відмічай по ходу)

- [x] 1. Згенерувати домен для API (robust-kindness)
- [x] 2. Postgres — додано
- [x] 3. Redis — додано (через `scripts/railway_complete_setup.py`)
- [x] 4. Змінні API (SECRET_KEY, DATABASE_URL, REDIS_URL, CELERY_*) — оновлено
- [x] 5. NEXT_PUBLIC_API_URL в dossier — встановлено
- [x] 6. Redeploy dossier та API — виконано
- [ ] 7. Додати Worker (див. нижче)
- [ ] 8. Зареєструвати користувача: `./scripts/register_admin.sh` або через UI

---

## 1. API сервіс (robust-kindness)

### 1.1 Домен
- **Settings** → **Networking** → **Generate Domain**
- Скопіюй URL (наприклад `https://robust-kindness-production-xxxx.up.railway.app`)

### 1.2 Змінні (Variables)
Додай у **Shared Variables** або в сервіс **robust-kindness**:

| Змінна | Значення | Обов'язково |
|--------|----------|-------------|
| `SECRET_KEY` | `openssl rand -base64 32` | Так |
| `DATABASE_URL` | З Railway Postgres (див. нижче) | Так |
| `REDIS_URL` | З Railway Redis (див. нижче) | Так |
| `CELERY_BROKER_URL` | = REDIS_URL | Так |
| `CELERY_RESULT_BACKEND` | REDIS_URL з `/1` замість `/0` (напр. `redis://.../1`) | Так |

**SECRET_KEY:** виконай `openssl rand -base64 32` у терміналі.

### 1.3 Postgres (Railway Pro)
- **+ New** → **Database** → **PostgreSQL**
- Підключи до проекту
- **Важливо:** сервіс має називатися **Postgres** (для ref `${{Postgres.DATABASE_URL}}`)
- Якщо інша назва — зміни змінну вручну в API

### 1.4 Redis (Railway Pro)
- **+ New** → **Database** → **Redis**
- Підключи до проекту
- Скопіюй `REDIS_URL`
- Додай у **robust-kindness** → Variables

## 2. Dossier (фронтенд)

### 2.1 Змінні
- `NEXT_PUBLIC_API_URL` = URL API з кроку 1.1 (з https://)

### 2.2 Redeploy
Після зміни `NEXT_PUBLIC_API_URL` — **Redeploy** dossier (змінна підставляється під час збірки).

## 3. Реєстрація користувача

1. Відкрий dossier: https://dossier-production-871b.up.railway.app/login
2. Вкладка **Реєстрація**
3. Логін, email, пароль → **Зареєструватися**
4. Потім **Вхід** з цими даними

## 4. Worker (Celery)

Для Maigret, Shodan та інших інструментів потрібен окремий Worker:

1. Railway → **+ New** → **Empty Service**
2. **Settings** → **Source** → Connect той самий GitHub repo
3. **Settings** → **Build**:
   - Root Directory: `.` (корінь)
   - Dockerfile Path: `worker/Dockerfile`
4. **Variables** — додати ті самі, що в API:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `REDIS_URL` = `${{Redis.REDIS_URL}}`
   - `CELERY_BROKER_URL` = `${{Redis.REDIS_URL}}`
   - `CELERY_RESULT_BACKEND` = `${{Redis.REDIS_URL}}`
   - `SECRET_KEY` = (той самий що в API)

## 5. Перевірка

- API health: https://robust-kindness-production.up.railway.app/health
- Dossier: https://dossier-production-871b.up.railway.app
- Реєстрація: `./scripts/register_admin.sh` (або UI → Реєстрація)
- Логін → Investigation → Maigret → PDF Report
