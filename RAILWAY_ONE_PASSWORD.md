# Один пароль для перевірки

## Що зробити

1. **Railway** → API → **Variables** → **Add Variable**
2. **Name:** `ALLOWED_PASSWORDS`
3. **Value (один рядок):**
   ```
   mJ9:fqQ?ptP3"jjT2)zoU4$qcC7<nn
   ```
4. **Save** — Railway перезапустить API

## Потім

1. Відкрий https://dossier-production-871b.up.railway.app/login
2. Введи цей код у поле «Код доступу»
3. Натисни «Увійти»

---

**Зміни вже в main:** один рядок (Код доступу), без логіна, без API URL. Зачекай 2–3 хв після redeploy.
