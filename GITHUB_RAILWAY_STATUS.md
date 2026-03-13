# Перевірка GitHub + Railway

## GitHub — обидва репо в порядку

| Репо | Доступ | Dockerfile.worker | Branch main |
|------|--------|------------------|-------------|
| **fzfw7ckckt-glitch/visual** | ✅ Публічний | ✅ В корені | ✅ Є |
| **rsumko-sys/visual** | ✅ Публічний | ✅ В корені | ✅ Є |

Обидва репо однакові, `Dockerfile.worker` є в корені обох.

## Що зроблено через API

- `rootDirectory` — очищено (пусто)
- `dockerfilePath` — `Dockerfile.worker`
- Redeploy запущено

## Чому Railway показує "No repositories found"

Railway підключається до GitHub через **один** акаунт. У пошуку показуються лише репо, до яких цей акаунт має доступ:

1. **fzfw7ckckt-glitch/visual** — Railway не бачить, якщо:
   - Railway прив’язаний до іншого акаунта (наприклад, rsumko-sys)
   - Railway GitHub App не встановлено на fzfw7ckckt-glitch/visual

2. **rsumko-sys/visual** — має бути видно, якщо Railway прив’язаний до rsumko-sys.

## Що зробити в Railway

1. **Переконатися, що worker підключений до rsumko-sys/visual**  
   (він має бути в списку, якщо Railway прив’язаний до rsumko-sys.

2. **Root Directory** — залишити порожнім (або `.`).

3. **Dockerfile Path** — `Dockerfile.worker`.

4. Якщо Railway прив’язаний до **fzfw7ckckt-glitch**:
   - GitHub → **fzfw7ckckt-glitch** → Settings → Applications → Railway → Configure
   - Додати доступ до репо fzfw7ckckt-glitch/visual, якщо його немає.

5. Якщо Railway прив’язаний до **rsumko-sys**:
   - Використовувати **rsumko-sys/visual**  
   - Перевірити, що Railway GitHub App має доступ до цього репо.
