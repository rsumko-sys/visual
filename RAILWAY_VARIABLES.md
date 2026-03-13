# Railway Variables — що встановити для кожного сервісу

## Redis (fda15c8b)
Змінні не потрібні — Railway налаштовує автоматично. Інші сервіси підключаються через `${{Redis.REDIS_URL}}`.

---

## API (robust-kindness, cb947afe)

| Variable | Значення | Обовʼязково |
|----------|----------|-------------|
| `SECRET_KEY` | Мінімум 32 символи (openssl rand -base64 32) | ✅ |
| `JWT_SECRET_KEY` | Те саме, що SECRET_KEY | ✅ |
| `DATABASE_URL` | `sqlite:///./osint.db` або Postgres URL | ✅ |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` | ✅ |
| `CELERY_BROKER_URL` | `${{Redis.REDIS_URL}}` | ✅ |
| `CELERY_RESULT_BACKEND` | `${{Redis.REDIS_URL}}` | ✅ |
| `RAILWAY_HEALTHCHECK_TIMEOUT_SEC` | `180` | Рекомендовано |

Опційно: `SHODAN_KEY`, `CENSYS_ID`, `CENSYS_SECRET`, `VIRUSTOTAL_KEY`, `HUNTER_IO_KEY`

---

## Worker (2ac77465)

| Variable | Значення |
|----------|----------|
| `SECRET_KEY` | Як у API |
| `JWT_SECRET_KEY` | Як у API |
| `DATABASE_URL` | Як у API |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |
| `CELERY_BROKER_URL` | `${{Redis.REDIS_URL}}` |
| `CELERY_RESULT_BACKEND` | `${{Redis.REDIS_URL}}` |
| `RAILWAY_HEALTHCHECK_TIMEOUT_SEC` | `180` |

---

## Dossier (faecda4a)

| Variable | Значення |
|----------|----------|
| `NEXT_PUBLIC_API_URL` | `https://robust-kindness-production.up.railway.app` |

---

## Як встановити через Dashboard

1. [Railway Project](https://railway.com/project/5ee64ab2-1677-47b5-86d5-4ea403bea2a6)
2. Обери сервіс → **Variables** → **Add Variable**
3. Для `${{Redis.REDIS_URL}}` — Railway підставить посилання на Redis автоматично

## Як встановити через скрипт

```bash
python3 scripts/railway_full_sync.py
```

(Генерує новий SECRET_KEY — існуючі JWT стануть невалідними)
