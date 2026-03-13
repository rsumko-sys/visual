# Railway Pro — повне налаштування OSINT Platform

## Чекліст (відмічай по ходу)

- [ ] 1. Згенерувати домен для API (robust-kindness)
- [ ] 2. Додати Postgres (Database → PostgreSQL)
- [ ] 3. Додати Redis (Database → Redis)
- [ ] 4. Додати змінні в API (SECRET_KEY, DATABASE_URL, REDIS_URL, CELERY_*)
- [ ] 5. Додати NEXT_PUBLIC_API_URL в dossier
- [ ] 6. Redeploy dossier
- [ ] 7. Зареєструвати користувача (UI або `scripts/register_admin.sh`)

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
- Скопіюй `DATABASE_URL` з Variables нового сервісу
- Додай у **robust-kindness** → Variables

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

## 4. Перевірка

- API health: `https://<api-domain>/health`
- Dossier: https://dossier-production-871b.up.railway.app
- Логін → Investigation → Maigret → PDF Report
