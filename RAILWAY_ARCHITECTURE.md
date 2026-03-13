# Railway + GitHub — архітектура та залежності

## Схема

```
GitHub (rsumko-sys/visual)  ──clone──►  Railway Project (robust-kindness)
        │                                        │
        │                                        ├── API (robust-kindness)     → Dockerfile.api, root=.
        │                                        ├── Worker                     → Dockerfile.worker, root=.
        │                                        ├── Dossier                    → web/Dockerfile, root=web
        │                                        └── Redis                      → Plugin
        │
        └── fzfw7ckckt-glitch/visual (origin) — альтернатива, якщо підключено
```

## Сервіси та їх залежності

| Сервіс | Repo | Root | Dockerfile | Потрібні змінні |
|--------|------|------|------------|-----------------|
| **API** | rsumko-sys/visual | `` | Dockerfile.api | SECRET_KEY*, JWT_SECRET_KEY*, DATABASE_URL, REDIS_URL, CELERY_* |
| **Worker** | rsumko-sys/visual | `` | Dockerfile.worker | SECRET_KEY*, JWT_SECRET_KEY*, DATABASE_URL, REDIS_URL, CELERY_* |
| **Dossier** | rsumko-sys/visual | web | web/Dockerfile | NEXT_PUBLIC_API_URL |
| **Redis** | — | — | Plugin | (авто) |

\* SECRET_KEY обовʼязковий — app.config виходить з exit(1) без нього. Worker імпортує app.tasks → app.config.

## Критичні залежності

1. **Worker залежить від app.config** — `celery -A app.tasks.celery_app` завантажує app.config → SECRET_KEY обовʼязковий.
2. **API і Worker мають однаковий SECRET_KEY** — для JWT узгодженості.
3. **VariableUpsert замінює тільки передані ключі** — інші зберігаються. Але якщо передати неповний набір, можна випадково скинути інші (залежить від API).
4. **Dossier root=web** — Next.js у web/, railway.toml у web/.

## Що ламається при зміні

| Дія | Наслідок |
|-----|----------|
| Змінити repo на fzfw7ckckt | "Could not find root directory" якщо Railway не має доступу |
| rootDirectory = "repo/name" | Помилка — це не шлях, а імʼя репо |
| Без SECRET_KEY у Worker | FATAL exit, контейнер не стартує |
| Різний SECRET_KEY у API/Worker | JWT не валідується між ними |
| Dossier root="" замість "web" | Не знайде package.json, Next.js не збереться |
