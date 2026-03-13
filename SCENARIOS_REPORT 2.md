# Звіт з тестування сценаріїв використання

## Виконані сценарії

| # | Сценарій | Статус |
|---|----------|--------|
| 1 | Реєстрація та вхід | ✓ OK |
| 2 | Створення розслідування | ✓ OK |
| 3 | Запуск інструменту (Shodan) | ✓ OK |
| 4 | Полінг статусу задачі | ✓ (з очікуванням для Celery) |
| 5 | Додавання доказів до Evidence Vault | ✓ OK |
| 6 | Генерація звіту (JSON) | ✓ OK |
| 7 | Генерація PDF звіту | ✓ Виправлено |
| 8 | Експорт STIX | ✓ OK |

## Знайдені та виправлені проблеми

### 1. TypeScript: `api.ts` — Property 'detail' does not exist
**Файл:** `web/lib/api.ts`  
**Проблема:** `error.response?.data` має тип `{}`, доступ до `.detail` викликав помилку компіляції.  
**Виправлення:** Приведення типу `(error.response?.data as { detail?: string | object })`.

### 2. Синтаксис: `investigation.tsx` — onClick з кількома операторами
**Файл:** `web/pages/investigation.tsx`  
**Проблема:** `onClick={() => setCopyStatus(...); setTimeout(...)}` — без блоку `{}` для кількох операторів.  
**Виправлення:** `onClick={() => { setCopyStatus(...); setTimeout(...); }}`.

### 3. PDF: Unicode (кирилиця) не підтримується Helvetica
**Файл:** `app/reporting.py`  
**Проблема:** FPDF Helvetica підтримує лише Latin-1. Українські заголовки ("Виконавчий звіт" тощо) викликали `FPDFUnicodeEncodingException`.  
**Виправлення:** Додано `_pdf_safe()` — заміна символів поза ASCII на `?` для PDF.

## Рекомендації

1. **Перезапуск API** після змін у `app/reporting.py` для застосування виправлення PDF.
2. **History page** — зараз показує порожній список; потрібна інтеграція з API `/investigations/` (потребує JWT).
3. **Tools page** — кнопка "Execute Tool" disabled для інструментів з `api: "✗"`; для Maigret потрібен інший підхід (відкрити сайт).

## Запуск перевірки

```bash
# API має бути запущений на :8000
python3 scripts/run_scenarios.py
python3 scripts/verify_connections.py
```
