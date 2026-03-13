# Аналітичний технічний звіт
## OSINT Platform 2026 — порівняння з узгодженою архітектурою

**Дата:** 2026-03-13  
**Версія:** 1.0

---

## 1. Узгоджена архітектура (цільовий стан)

### 1.1 Документована архітектура

Згідно з `RAILWAY_ARCHITECTURE.md`, `DEPLOYMENT.md`, `README.md`:

```
┌─────────────────────────────────────────────────────────────────┐
│                    УЗГОДЖЕНА АРХІТЕКТУРА                         │
├─────────────────────────────────────────────────────────────────┤
│  GitHub (rsumko-sys/visual)                                      │
│       │                                                          │
│       ▼                                                          │
│  Railway Project (robust-kindness)                               │
│       ├── API (FastAPI)        → Dockerfile.api, root=.          │
│       ├── Worker (Celery)      → Dockerfile.worker, root=.       │
│       ├── Dossier (Next.js)    → web/Dockerfile, root=web       │
│       └── Redis                → Plugin                         │
│                                                                  │
│  Docker (локально):                                              │
│       ├── Nginx (опційно)      → 80/443                          │
│       ├── FastAPI             → 8000                            │
│       ├── Next.js             → 3000                            │
│       ├── Celery Workers      → 4 concurrency                   │
│       ├── PostgreSQL          → 5432                            │
│       ├── Redis               → 6379                            │
│       ├── Tor                 → 9050 (SOCKS5)                   │
│       └── Chromium            → для скрапінгу                   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Очікувані компоненти

| Компонент | Технологія | Призначення |
|-----------|------------|-------------|
| API | FastAPI | REST API, JWT auth, rate limiting |
| Worker | Celery | Асинхронні OSINT-задачі |
| Dossier | Next.js 14 | Веб-інтерфейс (Material-UI) |
| DB | PostgreSQL / SQLite | Зберігання даних |
| Cache | Redis | Celery broker, кеш |
| Auth | JWT | Токени, get_current_user |

---

## 2. Поточна реалізація (фактичний стан)

### 2.1 Backend (API)

| Аспект | Узгоджено | Фактично | Статус |
|--------|-----------|----------|--------|
| Framework | FastAPI | FastAPI | ✅ |
| Роутери | health, auth, investigations, tools, reports, integration, vault | Всі підключені | ✅ |
| Auth | JWT | JWT + GET /auth/guest (beta, без пароля) | ⚠️ Beta-відхилення |
| CORS | — | Явні origins (localhost, dossier-production) | ✅ Виправлено |
| DB | PostgreSQL | SQLite fallback на Railway | ⚠️ Відхилення |
| Rate limiting | slowapi | slowapi + RateLimitMiddleware | ✅ |
| Tools | 150+ | 150, /tools/maigret → maigret_v3 | ✅ |

**API endpoints (фактичні):**
- `/health/`, `/health/live`, `/health/ready`
- `/auth/guest`, `/auth/token`, `/auth/register`
- `/investigations/`, `/investigations/{id}`
- `/tools/`, `/tools/{id}`, `/tools/{id}/run`, `/tools/status/{task_id}`, `/tools/stats`
- `/reports/{id}/evidence`, `/reports/{id}/generate-report`
- `/integration/` (webhooks, relations, pathways, map)
- `/vault/store`, `/vault/{id}/export/stix`

### 2.2 Frontend (Dossier)

| Аспект | Узгоджено | Фактично | Статус |
|--------|-----------|----------|--------|
| Framework | Next.js | Next.js 14 | ✅ |
| UI | Material-UI | MUI 5 | ✅ |
| Auth | Логін/пароль | Auto guest token (beta) | ⚠️ Beta-відхилення |
| Сторінки | Dashboard, Tools, Investigation | index, tools, investigation, graph, history, settings, security, terminal, login | ✅ |
| Layout | Sidebar | Layout з Drawer, breadcrumbs | ✅ |
| API client | — | axios, getApiBaseUrl(), Authorization header | ✅ |
| Clicks | — | pointerEvents: 'auto' на всіх сторінках | ✅ Виправлено |

**Сторінки та призначення:**
- `/` — Dashboard (OSINT Command Center)
- `/tools` — Каталог 150 інструментів, фільтри, модалка Run
- `/investigation` — Pipeline (Maigret, Shodan, GeoSpy, Pimeyes), Reload
- `/graph` — Візуалізація графу, Reload, Export
- `/history` — Історія розслідувань, Retry
- `/settings` — API URL, guest token
- `/security` — Статус безпеки
- `/terminal` — Демо-консоль
- `/login` — Редирект на `/` (beta)

### 2.3 Railway Production

| Сервіс | Узгоджено | Фактично | Статус |
|--------|-----------|----------|--------|
| Repo | rsumko-sys/visual | rsumko-sys/visual | ✅ |
| API | robust-kindness | robust-kindness-production.up.railway.app | ✅ |
| Dossier | dossier | dossier-production-871b.up.railway.app | ✅ |
| Redis | Plugin | Redis (fda15c8b) | ✅ |
| DB | Postgres (опційно) | SQLite (DATABASE_URL) | ⚠️ |

### 2.4 Docker (локально)

| Сервіс | Узгоджено | Фактично | Статус |
|--------|-----------|----------|--------|
| postgres | ✓ | ✓ | ✅ |
| redis | ✓ | ✓ | ✅ |
| tor | ✓ | ✓ | ✅ |
| api | ✓ | ✓ | ✅ |
| worker | ✓ | ✓ | ✅ |
| web | ✓ | ✓ | ✅ |
| nginx | Опційно | Є в compose | ✅ |

---

## 3. Відхилення від архітектури

### 3.1 Навмисні (Beta)

| Відхилення | Причина |
|------------|---------|
| Парольний вхід видалено | Beta: доступ без пароля |
| GET /auth/guest | Автоматичний токен для всіх |
| AuthGuard не редиректить | Всі маршрути відкриті |
| Layout без "Увійти" | Завжди Administrator • Beta |

### 3.2 Технічні

| Відхилення | Вплив |
|------------|-------|
| SQLite замість Postgres на Railway | Менша масштабованість, одна БД |
| CORS: явні origins замість * | Необхідно для credentials |
| ALLOWED_PASSWORDS у config | Не використовується (beta) |

### 3.3 Виправлені

| Проблема | Рішення |
|----------|---------|
| CORS wildcard + credentials | Явні origins |
| Chip onClick не працював | Button замість Chip (Investigation) |
| Кліки блоковані | pointerEvents: 'auto' |
| Відсутній Reload | Кнопки Reload / New Investigation |
| /tools/maigret 404 | Аліас maigret → maigret_v3 у get_tool_detail |
| History без Retry | Кнопка Повторити |

---

## 4. Діаграма поточного стану

```
                    ┌──────────────────────────────────────┐
                    │         Користувач (Browser)         │
                    └────────────────┬─────────────────────┘
                                     │
                    ┌────────────────▼─────────────────────┐
                    │  Dossier (Next.js)                   │
                    │  dossier-production-871b.railway.app  │
                    │  • AuthProvider → /auth/guest        │
                    │  • Layout, AuthGuard (pass-through)   │
                    │  • pointerEvents на всіх сторінках   │
                    └────────────────┬─────────────────────┘
                                     │ CORS (explicit origins)
                                     │ Authorization: Bearer
                    ┌────────────────▼─────────────────────┐
                    │  API (FastAPI)                         │
                    │  robust-kindness-production.railway.app│
                    │  • /auth/guest, /tools/, /investigations/ │
                    │  • SQLite (osint.db)                  │
                    └────────────────┬─────────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                        │
    ┌─────────▼─────────┐  ┌─────────▼─────────┐  ┌──────────▼──────────┐
    │  Redis            │  │  Worker (Celery)  │  │  (Postgres локально) │
    │  Broker + Cache    │  │  run_osint_tool   │  │  SQLite на Railway   │
    └───────────────────┘  └───────────────────┘  └─────────────────────┘
```

---

## 5. Рекомендації

### 5.1 Для production (після beta)

1. **Повернути парольний вхід** — `POST /auth/pass` + `ALLOWED_PASSWORDS`
2. **PostgreSQL на Railway** — замість SQLite для масштабування
3. **AuthGuard** — редирект на `/login` для захищених маршрутів

### 5.2 Підтримка

1. **CORS_ORIGINS** — env-змінна для додаткових origins
2. **full_scenarios_test.sh** — регулярний прогон сценаріїв
3. **RAILWAY_VARIABLES.md** — актуальний список змінних

---

## 6. Висновок

| Критерій | Оцінка |
|----------|--------|
| Відповідність архітектурі | 90% (beta-відхилення навмисні) |
| Стабільність | Покращено (CORS, clicks, Reload) |
| Тестованість | Smoke + full scenarios |
| Документація | RAILWAY_ARCHITECTURE, DEPLOYMENT, цей звіт |

**Підсумок:** Система відповідає узгодженій архітектурі з навмисними beta-відхиленнями (без пароля). Технічні виправлення (CORS, pointer-events, Reload, aliases) приведені у відповідність до очікуваної поведінки.
