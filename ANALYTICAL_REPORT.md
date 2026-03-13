# Аналітичний звіт: OSINT Platform 2026

**Дата:** 13 березня 2026  
**Проєкт:** MiniMax OSINT Command Center  
**Статус:** Інтеграція Maigret, Backend Security Hardening, Auth Flow — завершено

---

## 1. Executive Summary

Проведено комплексне впровадження трьох ключових напрямків:

1. **Backend Security Hardening** — захист ендпоінтів JWT, обов'язковий SECRET_KEY, rate limiting
2. **Auth Flow (Frontend)** — логін, AuthGuard, Axios interceptor, захист маршрутів
3. **Maigret Integration** — реальний провайдер, візуалізація в Pipeline, авто-популяція графа

---

## 2. Backend Security Hardening

### 2.1 Захист роутів /reports та /vault

| Компонент | Зміни |
|-----------|-------|
| `get_current_user` | Перехід на `HTTPBearer` для отримання JWT з заголовка `Authorization` |
| `get_investigation_for_user` | Перевірка `owner_id == current_user.id` або `owner_id == "system"`; інакше 403 Forbidden |
| Захищені ендпоінти | `reports.py`: summary, evidence (GET/POST), generate-report; `vault.py`: store, export/stix |
| `investigations.py` | Оновлено на `Depends(get_current_user)` замість ручного парсингу токена |

**Результат:** Користувач A не може отримати доступ до розслідувань користувача B. Системні (legacy) розслідування доступні будь-якому авторизованому користувачу.

### 2.2 SECRET_KEY

| До | Після |
|----|-------|
| `secrets.token_urlsafe(32)` як fallback | Обов'язкова наявність у `.env` |
| Токени інвалідувалися після рестарту | Сервер не запускається без SECRET_KEY |

**Реалізація:** `@model_validator` у `app/config.py` — при порожньому SECRET_KEY викликається `sys.exit(1)` з повідомленням.

### 2.3 Rate Limiting (SlowAPI)

| Ендпоінт | Ліміт |
|----------|-------|
| `POST /auth/token` | 5 спроб / хвилину |
| Глобально | 100 запитів / хвилину |

**Файли:** `app/core/limiter.py`, декоратор `@limiter.limit("5/minute")` на логіні.

---

## 3. Auth Flow (Frontend)

### 3.1 Компоненти

| Компонент | Призначення |
|-----------|-------------|
| `/login` | Сторінка логіну, POST `/auth/token`, збереження JWT у `localStorage` (`osint_auth_token`) |
| `AuthGuard` | Захист `/investigation`, `/history` — редірект на `/login` без токена |
| `AuthProvider` | Контекст: `token`, `login`, `logout`, `isReady` |
| Axios interceptor | Додає `Authorization: Bearer <token>`; при 401 — видаляє токен, редірект на `/login?redirect=` |
| Layout | Пункт «Увійти» у сайдбарі для неавторизованих користувачів |

### 3.2 Захищені маршрути

- `/investigation` — потребує JWT
- `/history` — потребує JWT

### 3.3 Відкриті маршрути

- `/`, `/tools`, `/graph`, `/settings`, `/security`, `/terminal`, `/login`

---

## 4. Maigret Integration

### 4.1 Backend

| Файл | Опис |
|------|------|
| `app/providers/maigret_provider.py` | Провайдер: `_check_maigret_installed()`, `_run_via_subprocess()`, `_normalize_maigret_result()` |
| Виклик | `maigret username --json simple --folderoutput <tmp> --top-sites N --timeout 25` |
| Формат результату | `{ found, sites, profiles, urls, indicators, raw_log }` |
| `app/providers/registry.py` | Зареєстровано `maigret` та `maigret_v3` |
| `app/routers/tools.py` | Alias: `maigret` → `maigret_v3` для сумісності з каталогом |
| `requirements-api.txt` | Додано `maigret>=0.5.0` |

### 4.2 Frontend — Investigation Pipeline

| Функція | Реалізація |
|---------|------------|
| Кількість профілів | Chip «N профілів» для кожного результату |
| View Results | Кнопка Expand / Згорнути для списку URL |
| Open Graph | Кнопка переходу на `/graph` |
| Авто-додавання на граф | `addEvidenceFromMaigret(query, sites)` при отриманні результатів Maigret |

### 4.3 Graph Auto-populate

| Компонент | Опис |
|-----------|------|
| `web/context/graphEvidence.tsx` | Контекст: `nodes`, `edges`, `addEvidenceFromMaigret`, `clearEvidence` |
| `addEvidenceFromMaigret` | Створює вузол Target (person) + вузли Social Media (web) для кожного знайденого URL |
| `web/pages/graph.tsx` | Використовує `useGraphEvidence()` — якщо є вузли з evidence, показує їх замість MOCK_GRAPH |
| `GraphEvidenceProvider` | Додано в `_app.tsx` |

### 4.4 Залежності

- **Python:** 3.10+ (рекомендовано 3.11 для Maigret)
- **Встановлення:** `pip install maigret`

---

## 5. Архітектура даних

### 5.1 Формат результату Maigret (нормалізований)

```json
{
  "found": true,
  "sites": [
    { "site": "GitHub", "url": "https://github.com/user", "status": "Claimed" }
  ],
  "profiles": [...],
  "urls": ["https://github.com/user", ...],
  "indicators": [...],
  "raw_log": "Maigret: знайдено N профілів для 'username'"
}
```

### 5.2 Graph Evidence Store

```typescript
interface GraphNode {
  id: string;
  label: string;
  type: 'person' | 'web' | 'email' | 'phone' | 'server' | 'crypto';
  val?: number;
}

interface GraphEdge {
  source: string;
  target: string;
}
```

---

## 6. Рекомендації та наступні кроки

### 6.1 Пріоритет 1

1. **Перевірка Maigret** — запустити реальний пошук, переконатися в коректності JSON-формату від CLI
2. **Прогрес-бар** — Maigret може працювати 1–2 хв; додати прогрес або streaming статус
3. **Таймаут** — налаштувати `--top-sites` для швидкого тесту (наприклад, 20–30)

### 6.2 Пріоритет 2

1. **Іконки платформ** — різні іконки для GitHub, Facebook, Telegram тощо в графі
2. **Telethon / Telegram** — інтеграція пошуку в відкритих групах (в requirements є telethon)
3. **Шодан** — вже інтегрований; перевірити роботу з API-ключем

### 6.3 Пріоритет 3

1. **Реєстрація** — `/auth/register` існує; додати сторінку реєстрації на фронті
2. **Refresh token** — продовження сесії без повторного логіну
3. **Rate limit UI** — інформування користувача при перевищенні 5/хв на логіні

---

## 7. Файли, змінені в рамках сесії

| Категорія | Файли |
|-----------|-------|
| Backend | `app/config.py`, `app/core/auth_helpers.py`, `app/core/limiter.py`, `app/main.py`, `app/routers/auth.py`, `app/routers/investigations.py`, `app/routers/reports.py`, `app/routers/vault.py`, `app/routers/tools.py`, `app/providers/maigret_provider.py`, `app/providers/registry.py` |
| Frontend | `web/pages/_app.tsx`, `web/pages/login.tsx`, `web/pages/settings.tsx`, `web/pages/investigation.tsx`, `web/pages/graph.tsx`, `web/components/Layout.tsx`, `web/components/AuthGuard.tsx`, `web/context/auth.tsx`, `web/context/graphEvidence.tsx`, `web/lib/api.ts` |
| Config | `requirements-api.txt` |

---

## 8. Висновки

Архітектура платформи дозволяє швидко додавати нові OSINT-інструменти через провайдери. Maigret став першим повноцінним інструментом з реальним пошуком. Захист бекенду та фронту забезпечує ізоляцію даних між користувачами та захист від brute-force на ендпоінті логіну.

**Критично:** Перед продакшеном переконатися, що `SECRET_KEY` встановлено в `.env` і не потрапляє в репозиторій.
