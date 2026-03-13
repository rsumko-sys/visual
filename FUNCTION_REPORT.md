# Звіт по функціях OSINT Platform 2026

**Дата:** 2026-03-13

---

## 1. Backend API (FastAPI)

### 1.1 app/main.py

| Функція | Опис | Endpoint |
|---------|------|----------|
| `root()` | Інформація про API: статус, версія, список endpoints | `GET /` |

---

### 1.2 app/routers/health.py

| Функція | Опис | Endpoint |
|---------|------|----------|
| `health_check()` | Основна перевірка здоров'я сервісу | `GET /health/` |
| `liveness()` | Liveness probe (Kubernetes/Docker) | `GET /health/live` |
| `readiness()` | Readiness probe | `GET /health/ready` |

---

### 1.3 app/routers/auth.py

| Функція | Опис | Endpoint |
|---------|------|----------|
| `verify_password()` | Перевірка пароля vs bcrypt hash | (helper) |
| `get_password_hash()` | Хешування пароля через bcrypt | (helper) |
| `create_access_token()` | Створення JWT токена | (helper) |
| `register()` | Реєстрація нового користувача | `POST /auth/register` |
| `guest_token()` | Beta: токен без пароля (системний користувач) | `GET /auth/guest` |
| `login()` | Логін за username/password → JWT | `POST /auth/token` |
| `get_current_user()` | Декодування JWT, пошук користувача в БД | Depends |

---

### 1.4 app/routers/investigations.py

| Функція | Опис | Endpoint |
|---------|------|----------|
| `create_investigation()` | Створення розслідування (auth) | `POST /investigations/` |
| `list_investigations()` | Список розслідувань поточного користувача | `GET /investigations/` |
| `get_investigation()` | Отримання одного розслідування | `GET /investigations/{id}` |

---

### 1.5 app/routers/tools.py

| Функція | Опис | Endpoint |
|---------|------|----------|
| `list_all_tools()` | Каталог всіх 150 інструментів | `GET /tools/` |
| `get_category()` | Інструменти за категорією | `GET /tools/category/{name}` |
| `search_tool()` | Пошук інструменту за назвою | `GET /tools/search/{name}` |
| `get_statistics()` | Статистика по категоріях | `GET /tools/stats` |
| `get_task_status()` | Статус Celery-задачі за task_id | `GET /tools/status/{task_id}` |
| `get_tool_detail()` | Деталі інструменту (maigret→maigret_v3 alias) | `GET /tools/{tool_id}` |
| `run_tool()` | Запуск інструменту через Celery | `POST /tools/{tool_id}/run` |

---

### 1.6 app/routers/reports.py

| Функція | Опис | Endpoint |
|---------|------|----------|
| `get_investigation_summary()` | Резюме розслідування + evidence count | `GET /reports/{id}/summary` |
| `add_evidence()` | Додати доказ у Evidence Vault (хешування) | `POST /reports/{id}/evidence` |
| `get_evidence()` | Отримати всі докази + перевірка цілісності | `GET /reports/{id}/evidence` |
| `_extract_tool_result()` | Витягти результат інструменту з evidence (helper) | — |
| `generate_investigation_report()` | Звіт у JSON/PDF/HTML/Markdown/CSV | `POST /reports/{id}/generate-report` |

---

### 1.7 app/routers/vault.py

| Функція | Опис | Endpoint |
|---------|------|----------|
| `calculate_hash()` | SHA-256 для Chain of Custody | (helper) |
| `store_evidence()` | Зберегти доказ (Form: source, data, metadata) | `POST /vault/store` |
| `export_to_stix()` | Експорт доказів у STIX 2.1 Bundle | `GET /vault/{id}/export/stix` |

---

### 1.8 app/routers/integration.py

| Функція | Опис | Endpoint |
|---------|------|----------|
| `register_webhook()` | Реєстрація вебхука на події | `POST /integration/{id}/webhooks/register` |
| `list_webhooks()` | Список вебхуків розслідування | `GET /integration/{id}/webhooks` |
| `disable_webhook()` | Деактивація вебхука | `DELETE /integration/{id}/webhooks/{wh_id}` |
| `create_chunk()` | Створити чанк даних | `POST /integration/{id}/chunks` |
| `get_chunks()` | Отримати чанки (опційно за типом) | `GET /integration/{id}/chunks` |
| `get_chunk_tree()` | Дерево чанків | `GET /integration/{id}/chunks/{cid}/tree` |
| `merge_chunks()` | Об'єднати чанки | `POST /integration/{id}/chunks/merge` |
| `create_relation()` | Зв'язок між чанками (weight 0–1) | `POST /integration/{id}/relations` |
| `find_path()` | Шлях між двома чанками | `GET /integration/{id}/relations/path` |
| `get_entity_network()` | Мережа сутностей (depth 1–5) | `GET /integration/{id}/relations/network` |
| `get_connected_components()` | Пов'язані компоненти | `GET /integration/{id}/relations/components` |
| `create_pathway()` | Створити шлях зєднання | `POST /integration/{id}/pathways` |
| `get_pathways()` | Всі шляхи розслідування | `GET /integration/{id}/pathways` |
| `get_strongest_pathways()` | Найсильніші шляхи (limit 1–20) | `GET /integration/{id}/pathways/strongest` |
| `visualize_pathway()` | Візуалізація шляху | `GET /integration/{id}/pathways/{pid}/visualize` |
| `get_investigation_map()` | Повна карта розслідування | `GET /integration/{id}/map` |

---

## 2. Celery Worker (app/tasks.py)

| Функція | Опис | Використання |
|---------|------|--------------|
| `calculate_hash()` | SHA-256 хеш | Evidence Vault |
| `_mock_result()` | Fallback-результат без реальної інтеграції | Якщо execute_tool → None |
| `run_osint_tool()` | Запуск провайдера, збереження в Vault | Celery task |
| `test_task()` | Тестова задача | Celery test |

---

## 3. Провайдери OSINT (app/providers/)

### 3.1 registry.py

| Функція | Опис |
|---------|------|
| `get_provider()` | Повертає провайдер за tool_id (shodan, maigret, maigret_v3) |
| `execute_tool()` | Виконує інструмент через провайдер, повертає результат або None |

### 3.2 maigret_provider.py

| Функція | Опис |
|---------|------|
| `_check_maigret_installed()` | Перевірка наявності пакету maigret |
| `_run_via_subprocess()` | Fallback: запуск через CLI maigret |
| `_normalize_maigret_result()` | Нормалізація JSON Maigret → {found, sites, urls, indicators} |
| `run()` (MaigretProvider) | Головний метод: API або subprocess |

---

## 4. Reporting (app/reporting.py)

| Функція | Опис |
|---------|------|
| `_pdf_safe()` | Sanitize тексту для PDF (Latin-1) |
| `parse_maigret_for_table()` | Maigret JSON → список (site, url, status) |
| `ReportGenerator.__init__()` | Ініціалізація звіту |
| `add_executive_summary()` | Резюме, target, findings, risk_level |
| `add_osint_search_results()` | Таблиця OSINT (maigret, sherlock) |
| `add_geolocation_data()` | Секція геолокації |
| `add_network_intelligence()` | Секція мережевої розвідки |
| `add_evidence()` | Докази з хешами |
| `add_social_analysis()` | Аналіз соцмереж |
| `add_financial_data()` | Фінансові дані |
| `add_threat_assessment()` | Оцінка загроз |
| `add_recommendations()` | Рекомендації |
| `add_conclusion()` | Висновки |
| `to_pdf()` | Генерація PDF bytes |
| `generate_json_report()` | JSON звіт |
| `generate_markdown_report()` | Markdown звіт |
| `generate_html_report()` | HTML звіт |
| `generate_csv_report()` | CSV звіт |
| `export()` | Експорт у обраний формат |

---

## 5. Core / Database

### 5.1 app/database.py

| Функція | Опис |
|---------|------|
| `get_db()` | SQLAlchemy session generator (Depends) |

### 5.2 app/core/auth_helpers.py

| Функція | Опис |
|---------|------|
| `get_investigation_for_user()` | Перевірка ownership (owner_id або system) |

---

## 6. Frontend (web/)

### 6.1 web/lib/api.ts

| Функція | Опис |
|---------|------|
| `normalizeApiUrl()` | s:// → https://, додає протокол якщо відсутній |
| `getApiBaseUrl()` | API URL: localStorage, env або production fallback |

### 6.2 web/context/auth.tsx

| Функція | Опис |
|---------|------|
| `AuthProvider` | Контекст: token, login, logout; auto guest token (beta) |
| `useAuth()` | Хук для доступу до auth контексту |

### 6.3 web/context/graphEvidence.tsx

| Функція | Опис |
|---------|------|
| `GraphEvidenceProvider` | Контекст доказів для графа |
| `useGraphEvidence()` | Хук для доказів у графі |

### 6.4 web/hooks/useDebounce.ts

| Функція | Опис |
|---------|------|
| `useDebounce()` | Debounce значення з затримкою |

### 6.5 web/pages/graph.tsx

| Функція | Опис |
|---------|------|
| `loadGraphSettings()` | Завантаження налаштувань графа з localStorage |
| `saveGraphSettings()` | Збереження налаштувань |
| `getNodePositions()` | Розрахунок позицій вузлів по колу |

---

## 7. Тести

| Файл | Функція | Опис |
|------|---------|------|
| test_api.py | `test_root`, `test_health_*`, `test_tools_*`, `test_run_tool`, `test_register_*` | Базові API тести |
| test_tools_api.py | `test_tool_run`, `test_category` | Тести інструментів |
| test_full_system.py | `test_tools_endpoints`, `test_vault_stix`, `test_reports_pdf`, `test_task_status` | Повний цикл |
| test_comprehensive.py | `test_full_investigation_flow`, `test_stix_export_integrity`, `test_vault_storage` | Security |
| test_headers.py | `test_security_headers`, `test_cors_headers` | Headers |
| test_search.py | `test_search_*`, `test_get_new_categories` | Пошук |

---

## 8. Scripts

| Файл | Функція | Опис |
|------|---------|------|
| railway_connect_repo.py | `gql()`, `main()` | Підключення repo, redeploy Railway |
| railway_full_sync.py | `gql()`, `main()` | Синхронізація змінних, source, redeploy |
| railway_full_setup.py | — | Повне налаштування Railway |
| railway_complete_setup.py | — | Redis, API, Dossier redeploy |
| create_admin.py | `gen_password()`, `main()` | Створення адміна |
| verify_connections.py | `request()`, `auth_headers()`, `check()`, `main()` | Перевірка з'єднань |
| run_scenarios.py | `req()`, `main()` | Запуск сценаріїв |

---

## Підсумок

| Категорія | Кількість функцій |
|-----------|-------------------|
| API endpoints (routers) | ~40 |
| Celery tasks | 2 |
| Providers | 4 |
| Reporting | ~25 |
| Frontend (context/hooks/lib) | ~8 |
| Тести | ~15 |
| Scripts | ~12 |

**Всього:** ~106 функцій у Backend + Frontend + Scripts + Tests.
