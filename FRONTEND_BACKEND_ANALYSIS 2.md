# Аналіз зв'язків Frontend ↔ Backend

## 1. Архітектура з'єднання

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js :3000)                                        │
│  web/lib/api.ts — axios, baseURL з localStorage або env          │
│  Ключ: NEXT_PUBLIC_API_URL (default: http://localhost:8000)      │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP/JSON
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND (FastAPI :8000)                                         │
│  /auth, /reports, /tools, /vault, /investigations, /health       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Матриця використання API

| Сторінка / компонент | Виклики API | Backend endpoint |
|----------------------|-------------|------------------|
| **Tools** | `GET /tools/` | `tools.router` |
| **Tools** | `POST /tools/{id}/run` | `tools.router` |
| **Investigation** | `POST /tools/{id}/run` | `tools.router` |
| **Investigation** | `GET /tools/status/{task_id}` | `tools.router` |
| **Investigation** | `POST /reports/{id}/evidence` | `reports.router` |
| **Investigation** | `POST /reports/{id}/generate-report?format=pdf` | `reports.router` |
| **Investigation** | `GET /vault/{id}/export/stix` | `vault.router` |
| **History** | — | ❌ Не використовує API |
| **Settings** | — | `getApiBaseUrl()` (localStorage) |
| **Graph, Terminal, Security** | — | ❌ Не використовує API |

---

## 3. Детальний потік даних

### 3.1 Tools Catalog

**Frontend:** `api.get('/tools/')`  
**Backend:** `GET /tools/` → `ToolsCatalogResponse`

```json
{
  "total_tools": 150,
  "total_categories": 12,
  "categories": {
    "GEOINT": { "name": "...", "count": 20, "tools": [...] },
    "SIGINT": { ... }
  }
}
```

**Сумісність:** ✓ Frontend очікує `response.data.categories` — структура збігається.

---

### 3.2 Tool Run (Investigation)

**Frontend:** `api.post(`/tools/${tool.id}/run`, { query, investigation_id, api_key })`  
**Backend:** `POST /tools/{tool_id}/run` — Body: `ToolRequest`

**Request:**
```json
{
  "query": "8.8.8.8",
  "investigation_id": "inv_1234567890_abc123",
  "api_key": "user_key_from_localStorage"
}
```

**Response:**
```json
{
  "task_id": "mock_task_xxx" | "celery-uuid",
  "tool_id": "shodan",
  "tool_name": "Shodan",
  "status": "queued" | "mocked_success",
  "query": "8.8.8.8"
}
```

**Сумісність:** ✓

---

### 3.3 Tool Status

**Frontend:** `api.get(`/tools/status/${taskId}`)`  
**Backend:** `GET /tools/status/{task_id}`

**Response (mock):**
```json
{
  "task_id": "mock_task_xxx",
  "status": "completed",
  "ready": true,
  "result": {
    "data": { "found": true, "indicators": [...], "raw_log": "..." }
  }
}
```

**Response (Celery):**
```json
{
  "task_id": "uuid",
  "status": "completed",
  "ready": true,
  "result": {
    "tool": "shodan",
    "query": "...",
    "status": "completed",
    "timestamp": "...",
    "data": { ... }
  }
}
```

**Frontend:** `statusRes.data.result.data` — для mock і Celery `data` є в обох структурах. ✓

---

### 3.4 Add Evidence

**Frontend:** `api.post(`/reports/${invId}/evidence`, { source, data, target })`  
**Backend:** `POST /reports/{investigation_id}/evidence` — Body: `dict`

**Request:**
```json
{
  "source": "Shodan",
  "data": "{\"found\":true,\"indicators\":[...]}",
  "target": "8.8.8.8"
}
```

**Сумісність:** ✓ Backend `add_evidence` auto-creates Investigation для `inv_xxx`, зберігає `evidence.data = json.dumps(evidence)` (full payload).

---

### 3.5 Generate Report (PDF)

**Frontend:** `api.post(`/reports/${invId}/generate-report?format=pdf`, {}, { responseType: 'blob' })`  
**Backend:** `POST /reports/{investigation_id}/generate-report?format=pdf`

**Response:** `application/pdf` (binary)

**Примітка:** PDF 500 може бути через кирилицю (виправлено `_pdf_safe`). Потрібен перезапуск API.

---

### 3.6 Export STIX

**Frontend:** `api.get(`/vault/${invId}/export/stix`)`  
**Backend:** `GET /vault/{investigation_id}/export/stix`

**Response:** JSON STIX bundle

**Сумісність:** ✓

---

## 4. Потоки без інтеграції

### 4.1 Auth / Investigations

| Backend | Frontend |
|---------|----------|
| `POST /auth/register` | ❌ Не використовується |
| `POST /auth/token` | ❌ Не використовується |
| `POST /investigations/` | ❌ Не використовується |
| `GET /investigations/` | ❌ Не використовується |
| `GET /investigations/{id}` | ❌ Не використовується |

**Investigation Hub** використовує клієнтський `inv_${Date.now()}_${random}`. Investigation створюється автоматично при першому `add_evidence`.

### 4.2 History

**History** не робить запитів до API. Список investigations порожній — можна підключити `GET /investigations/`, але потрібен JWT.

### 4.3 Backend без frontend

- `/integration/*` — інтеграційні ендпоінти не використовуються у UI
- `/health/*` — тільки для моніторингу
- `/tools/category/{name}`, `/tools/search/{name}`, `/tools/{id}` — не використовуються у UI
- `/vault/store` — POST для збереження, frontend використовує `/reports/{id}/evidence`

---

## 5. Конфігурація

| Параметр | Frontend | Backend |
|----------|----------|---------|
| API URL | `localStorage.NEXT_PUBLIC_API_URL` або `process.env.NEXT_PUBLIC_API_URL` | — |
| API Keys | `localStorage.api_key_${toolId}` | Передається в body |
| CORS | — | `allow_origins=["*"]` |

---

## 6. Обробка помилок

- **Frontend:** `api` interceptor → `api-error` event → `ApiErrorHandler` → Snackbar
- **Backend:** HTTPException → `{"detail": "..."}`

---

## 7. Висновки

| Аспект | Статус |
|--------|--------|
| Tools API | ✓ Повна сумісність |
| Reports API | ✓ Evidence, generate-report |
| Vault API | ✓ STIX export |
| Auth API | ⚠ Не використовується |
| Investigations API | ⚠ Не використовується (замість нього inv_xxx) |
| History | ❌ Не підключено до API |
| Data flow | ✓ Структури даних узгоджені |
