# Що не так з Railway

## Поточний стан

| Сервіс | Статус | Проблема |
|--------|--------|----------|
| **API** (robust-kindness) | FAILED | Деплой падає, 404 |
| **Worker** | ? | Перевірити в Dashboard |
| **Dossier** | OK | 200 |
| **Redis** | ? | Перевірити |

## Можливі причини падіння API

### 1. API підключено до неправильного репо

- **origin** (fzfw7ckckt-glitch/visual) — там **старий код** (без healthcheck fix)
- **myfork** (rsumko-sys/visual) — там **новий код**
- Push до origin заборонено (403)

**Що зробити:** Railway → robust-kindness → Settings → Source → переключити на **rsumko-sys/visual** (branch main).

### 2. Healthcheck не проходить

- Railway чекає 200 від `/health/` протягом 180 сек
- Якщо app не встигає стартувати — деплой FAILED

**Що перевірити:** Build Logs і Deploy Logs у Railway Dashboard — чи є помилки при старті.

### 3. SECRET_KEY

- Якщо SECRET_KEY не встановлено — app виходить з `FATAL: SECRET_KEY must be set`
- Змінні вже оновлені через API

### 4. Alembic / база даних

- `alembic upgrade head` може падати
- Додано `|| true` — міграції не мають блокувати старт

## Що зробити зараз

1. **Railway Dashboard** → robust-kindness → **Deployments** → останній failed → **Build Logs** і **Deploy Logs**
2. Скопіюй останні рядки логів — там буде точна причина
3. **Source** → якщо підключено fzfw7ckckt-glitch/visual → переключи на **rsumko-sys/visual**

## Швидка перевірка

```bash
# Dossier (має працювати)
curl -s -o /dev/null -w "%{http_code}" https://dossier-production-871b.up.railway.app/

# API (зараз 404)
curl -s https://robust-kindness-production.up.railway.app/health/
```
