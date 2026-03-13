# Перевірка UX та підключень

## Схема підключень

```
┌─────────────────────────────────────────────────────────────────┐
│  Dossier (Next.js)                                               │
│  https://dossier-production-871b.up.railway.app                   │
│                                                                  │
│  getApiBaseUrl():                                                │
│    1. localStorage('NEXT_PUBLIC_API_URL')  ← Settings          │
│    2. process.env.NEXT_PUBLIC_API_URL        ← Build-time (Railway var)
│    3. 'http://localhost:8000'                 ← Fallback         │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  API (FastAPI)                                                   │
│  https://robust-kindness-production.up.railway.app               │
│                                                                  │
│  Endpoints: /auth/*, /tools/*, /investigations/*, /reports/*,   │
│             /vault/*, /health/                                   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  Worker (Celery) + Redis                                         │
│  Обробка задач /tools/{id}/run → task_id → /tools/status/{id}   │
└─────────────────────────────────────────────────────────────────┘
```

## Перевірений UX flow

| Крок | Endpoint | Статус |
|------|----------|--------|
| Реєстрація | POST /auth/register | ✅ |
| Логін | POST /auth/token | ✅ |
| Каталог інструментів | GET /tools/ | ✅ (150 tools) |
| Створення розслідування | POST /investigations/ | ✅ |
| Запуск інструменту | POST /tools/{id}/run | ✅ (queued) |
| Статус задачі | GET /tools/status/{task_id} | ✅ |

## Сторінки Dossier

| Сторінка | Шлях | Захист | API виклики |
|----------|------|--------|-------------|
| Home | / | — | — |
| Login | /login | — | /auth/token, /auth/register |
| Tools | /tools | Layout | GET /tools/, POST /tools/{id}/run |
| Investigation | /investigation | AuthGuard | /investigations/, /reports/, /vault/, /tools/run |
| History | /history | AuthGuard | GET /investigations/ |
| Graph | /graph | Layout | — |
| Terminal | /terminal | Layout | — |
| Settings | /settings | Layout | /auth/token, getApiBaseUrl |
| Security | /security | Layout | — |

## Налаштування API URL

- **Build-time:** NEXT_PUBLIC_API_URL у Railway Variables для Dossier
- **Runtime:** Користувач може змінити в Settings → зберігається в localStorage
- **При 404:** Login показує підказку "Перевірте URL в Налаштуваннях"

## Auth flow

1. Неавторизований → /investigation, /history → редирект на /login?redirect=...
2. Логін → JWT у localStorage (osint_auth_token)
3. 401 від API → очистка токена, редирект на /login

## Запуск тестів і сценаріїв

```bash
# Unit-тести (без API)
python3 -m pytest tests/ -v

# Інтеграційні тести проти production
API_URL=https://robust-kindness-production.up.railway.app python3 -m pytest tests/ -v

# Сценарії роботи (8 кроків)
API_URL=https://robust-kindness-production.up.railway.app python3 scripts/run_scenarios.py

# UX перевірка
./scripts/verify_ux.sh
```

## Що перевірити вручну

1. **Dossier → Login** — admin / 1488 (або uxtest / TestPass123!)
2. **Settings** — API URL має бути https://robust-kindness-production.up.railway.app
3. **Tools** — вибір інструменту, Run → task_id, перевірка статусу
4. **Investigation** — створити, додати evidence, згенерувати PDF/STIX
