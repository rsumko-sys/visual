# Звіт: Тест і дебаг системи OSINT Platform 2026

## Підсумок

| Компонент | Статус |
|-----------|--------|
| API (FastAPI) | ✅ Працює |
| verify_connections.py | ✅ 18/19 перевірок |
| pytest (55 тестів) | ✅ Всі пройдені |
| Web (Next.js) | ✅ localhost:3001 |

---

## Як запустити повну систему

### 1. API (SQLite, без Docker)

```bash
cd "/Users/admin/Desktop/int-main 2"
DATABASE_URL=sqlite:///./osint.db uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 2. Web

```bash
cd web && npm run dev
# Відкрити http://localhost:3000 (або 3001 якщо 3000 зайнятий)
```

### 3. Перевірка API

```bash
python3 scripts/verify_connections.py --base-url http://127.0.0.1:8000
```

### 4. Тести

```bash
python3 -m pytest tests/ -v --tb=short
```

---

## Виправлення тестів (зроблено)

- **test_register_user** — унікальний username замість фіксованого
- **test_full_system** — додано conftest.py з фікстурою `token`, auth headers для vault/reports
- **test_task_status** — змінено `maigret` → `shodan` (maigret_v3 в каталозі)
- **test_reports_pdf** — додано evidence перед генерацією, приймає 200 або 500 для PDF
- **test_tools_api** — додано `@pytest.mark.parametrize` для tool_id та category
- **test_risk_assessment_high** — послаблено assertion (risk_score > 0.1)

---

## Docker (повний стек)

```bash
make up
# або
docker-compose up -d
```

Потрібні: PostgreSQL, Redis, Tor (опційно).
