# Action Plan: Перший реальний запуск (1 година)

**Мета:** Перевірити Maigret, Graph auto-populate та захист маршрутів.

---

## Передумови

- [ ] API запущено: `uvicorn app.main:app --reload` (порт 8000)
- [ ] Celery + Redis запущено: `celery -A app.tasks worker -l info`
- [ ] Frontend запущено: `npm run dev` (порт 3000)
- [ ] Maigret встановлено: `pip install maigret`
- [ ] Користувач зареєстрований (через API або `/auth/register`)

---

## Крок 1: Запустити Maigret

1. Відкрий **Investigation Hub** (`/investigation`)
2. У полі **Target Query** введи свій нікнейм або відому публічну особу (наприклад: `machine42`, `torvalds`, `gvanrossum`)
3. Додай інструмент **Maigret v3.0** (клік по чіпу)
4. Натисни **Start Multi-Vector Search**
5. Зачекай 1–2 хвилини (Maigret перевіряє сотні сайтів)

**Очікуваний результат:** Статус «completed», у Intelligence Stream з’являється картка з кількістю знайдених профілів.

---

## Крок 2: Спостерігати за Graph

1. Під час або після пошуку перейди на **Visual Graph** (`/graph`)
2. Якщо Maigret знайшов профілі — граф має показати:
   - **Центральний вузол (Target)** — твій нікнейм
   - **Вузли Social Media** — кожен знайдений URL як окремий вузол, з’єднаний з Target

**Якщо граф порожній:** Натисни **View Results** у картці результату Maigret, потім **Open Graph** — дані передаються в контекст і мають з’явитися на графі.

---

## Крок 3: Перевірити «Броню» (Auth)

1. Вийди з акаунту (Settings → Вийти) або відкрий інкогніто
2. Спробуй перейти на **History** (`/history`)
3. **Очікуваний результат:** Редірект на `/login?redirect=%2Fhistory`
4. Спробуй перейти на **Investigation** (`/investigation`)
5. **Очікуваний результат:** Редірект на `/login?redirect=%2Finvestigation`
6. Увійди — має відбутися повернення на `redirect` URL

---

## Чеклист після запуску

| Перевірка | ✓ |
|-----------|---|
| Maigret повернув результати (sites/urls) | |
| Pipeline показав «N профілів» | |
| View Results розгорнув список URL | |
| Graph відобразив вузли з evidence | |
| /history без логіну → редірект на /login | |
| /investigation без логіну → редірект на /login | |

---

## Якщо щось не працює

- **Maigret не знаходить профілі:** Спробуй інший нікнейм або перевір логи Celery
- **Graph порожній:** Переконайся, що ти на сторінці Investigation під час отримання результатів (addEvidenceFromMaigret викликається там)
- **401 на /reports:** Переконайся, що ти залогінений і JWT передається (перевір Network → Headers)
- **Celery fallback (mock_task_xxx):** Redis не запущено — запусти `redis-server` і Celery worker
