# Локальний запуск OSINT Platform 2026

## Мінімальний варіант (без Docker)

### 1. Підготовка

```bash
cd "/Users/admin/Desktop/int-main 2"

# Python-залежності
pip install -r requirements-api.txt

# Node-залежності
cd web && npm install && cd ..
```

### 2. Запуск API

```bash
# SQLite (без PostgreSQL)
export DATABASE_URL=sqlite:///./osint.db

# Опційно: Redis для Celery (без нього — mock-результати)
# export REDIS_URL=redis://localhost:6379/0

uvicorn app.main:app --host 127.0.0.1 --port 8000
```

API: http://localhost:8000  
Docs: http://localhost:8000/docs

### 3. Запуск Web (окремий термінал)

```bash
cd web
npm run dev
```

Web: http://localhost:3000

### 4. Перевірка

```bash
python3 scripts/verify_connections.py --base-url http://127.0.0.1:8000
```

---

## Один рядок (API)

```bash
DATABASE_URL=sqlite:///./osint.db uvicorn app.main:app --host 127.0.0.1 --port 8000
```

---

## З Redis (реальні Celery-задачі)

1. Встановити Redis: `brew install redis` (macOS) або `docker run -d -p 6379:6379 redis`
2. Запустити Redis: `redis-server`
3. Запустити Worker (окремий термінал):

```bash
export DATABASE_URL=sqlite:///./osint.db
export REDIS_URL=redis://localhost:6379/0
celery -A app.tasks.celery_app worker --loglevel=info
```

4. API — як у п. 2 вище
