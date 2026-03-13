# Глибокий аналіз OSINT Platform 2026

## 1. Архітектура

### 1.1 Стек

| Шар | Технологія |
|-----|------------|
| Frontend | Next.js 14, React 18, MUI 5, Axios, Cytoscape |
| Backend | FastAPI, Uvicorn |
| DB | SQLite (dev) / PostgreSQL (prod) |
| Queue | Celery + Redis |
| Auth | JWT (python-jose), bcrypt |

### 1.2 Структура

```
app/
├── main.py           # FastAPI app, middleware
├── config.py         # Pydantic Settings
├── database.py       # SQLAlchemy engine
├── models.py         # User, Investigation, Evidence
├── tasks.py          # Celery tasks
├── reporting.py      # PDF/HTML/MD/CSV звіти
├── routers/          # auth, investigations, tools, reports, vault, integration, health
├── providers/        # Shodan (реальна інтеграція)
├── core/             # SecurityMiddleware, RateLimitMiddleware
└── data/             # tools_catalog (150 інструментів)

web/
├── pages/            # index, investigation, tools, graph, history, settings, security, terminal
├── components/       # Layout, ApiErrorHandler
└── lib/              # api.ts (axios client)
```

---

## 2. Безпека

### 2.1 Що реалізовано ✓

- **Security headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, HSTS, CSP, Referrer-Policy, Permissions-Policy
- **JWT auth** для `/investigations` (owner_id)
- **Bcrypt** для хешування паролів
- **CORS** налаштовано
- **Evidence hash** (SHA-256) для цілісності
- **API keys** у localStorage (не на сервері)

### 2.2 Проблеми ⚠

| Проблема | Опис |
|----------|------|
| **CORS allow_origins="*"** | У prod потрібно обмежити origins |
| **Reports/Vault без auth** | `/reports/{id}/evidence`, `/vault/{id}/export/stix` не перевіряють JWT — будь-хто з inv_id може читати/писати |
| **Rate limit не працює** | `RateLimitMiddleware` лише додає X-Process-Time, не обмежує запити (slowapi в requirements, але не використовується) |
| **SECRET_KEY fallback** | `secrets.token_urlsafe(32)` при кожному запуску — токени інвалідуються після рестарту |
| **system user** | Пароль `system_no_login` — якщо хтось отримає доступ до DB |

---

## 3. База даних

### 3.1 Моделі

- **User**: id, username, email, hashed_password
- **Investigation**: id, owner_id, title, target_identifier, status
- **Evidence**: id, investigation_id, source, data (JSON), hash_sha256

### 3.2 Потенційні проблеми

- **SQLite** у dev: `check_same_thread=False` — потрібно для FastAPI
- **Celery + SQLite**: SessionLocal у task — ок для SQLite, але pool_pre_ping вимкнено
- **Evidence.data**: зберігає повний JSON (frontend wrapper `{source, data, target}` або Celery `data_result`) — парсинг у reports через `_extract_tool_result`

---

## 4. Backend API

### 4.1 Використовується фронтом

| Endpoint | Auth | Статус |
|----------|------|--------|
| GET /tools/ | ❌ | ✓ |
| POST /tools/{id}/run | ❌ | ✓ |
| GET /tools/status/{id} | ❌ | ✓ |
| POST /reports/{id}/evidence | ❌ | ✓ (auto-create inv) |
| POST /reports/{id}/generate-report | ❌ | ✓ |
| GET /vault/{id}/export/stix | ❌ | ✓ |

### 4.2 Не використовується фронтом

- `/auth/register`, `/auth/token` — немає логіну в UI
- `/investigations/*` — фронт використовує inv_xxx (client-generated)
- `/integration/*` — webhooks, chunks, relations, pathways, map — повністю відсутні в UI
- `/tools/category/{name}`, `/tools/search/{name}`, `/tools/{id}` — Tools Catalog бере все з GET /tools/

### 4.3 Celery

- **Без Redis**: повертає `mock_task_xxx`, status одразу ready
- **З Redis без worker**: task_id реальний, але ready ніколи не стане true
- **Провайдери**: лише Shodan реалізований; інші 149 інструментів — mock

---

## 5. Frontend

### 5.1 Сторінки

| Сторінка | API | Дані |
|----------|-----|------|
| Dashboard | — | Статична |
| Investigation | tools, reports, vault | inv_xxx, polling |
| Tools | GET /tools/, POST run | categories з API |
| Graph | — | MOCK_GRAPH (статичний) |
| History | — | Порожній масив |
| Settings | — | localStorage |
| Security | — | Статичний чекліст |
| Terminal | — | Placeholder |

### 5.2 Потенційні проблеми

- **recharts** в package.json — не використовується
- **Investigation polling**: 30 спроб по 1 сек — при Celery без worker зависання 30 сек на інструмент
- **PDF export**: при 500 не показує користувачу причину (лише console.error)

---

## 6. Залежності

### 6.1 Python (requirements-api.txt)

| Пакет | Примітка |
|-------|----------|
| aioredis | Deprecated, функціонал у redis 4.2+ |
| slowapi | Є в requirements, не використовується |
| telethon | Для Telegram — не інтегровано в providers |
| aiohttp-socks | Для Tor — не використовується в коді |

### 6.2 Файлова система

- **web/cd web.yml** — помилково створений файл (містить `cd web`, `npm install`, `npm run dev`)

---

## 7. Docker

- **docker-compose.yml**: postgres, redis, tor, api, worker, web
- **docker-compose.dev.yml**: hot reload, adminer, pgadmin, redis-commander
- **DATABASE_URL** у контейнері: PostgreSQL (не SQLite)
- **Redis** з паролем — CELERY_BROKER_URL має включати пароль

---

## 8. Рекомендації (пріоритет)

### Високий

1. **Auth для reports/vault** — перевірка owner або публічний inv_id з обмеженням
2. **SECRET_KEY** — обов'язково з .env, без fallback
3. **Rate limiting** — підключити slowapi або інший механізм

### Середній

4. **History + API** — інтегрувати GET /investigations/ з JWT (додати login у UI)
5. **Видалити cd web.yml** — помилковий файл
6. **PDF error feedback** — показувати Snackbar при помилці експорту

### Низький

7. **aioredis** — замінити на redis (aioredis deprecated)
8. **recharts** — видалити з package.json якщо не використовується
9. **Integration router** — або підключити до UI, або документувати як API для зовнішніх клієнтів

---

## 9. Підсумок

| Аспект | Оцінка |
|--------|--------|
| Архітектура | ✓ Модульна, зрозуміла |
| Backend API | ✓ Основні flows працюють |
| Frontend | ✓ UI консистентний, responsive |
| Безпека | ⚠ Потребує посилення (auth, rate limit) |
| Інтеграції | ⚠ Лише Shodan реальний, 149 mock |
| Тести | ⚠ Базові (test_api.py) |
| Документація | ✓ README, DEPLOYMENT, FRONTEND_BACKEND_ANALYSIS |
