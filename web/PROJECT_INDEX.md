# Project Index — No Fix-and-Break Reference

> **Правило**: Якщо змінюєш функцію/тип/стиль в одному місці — перевір, чи не використовується він в інших компонентах.

---

## 1. App Entry (`pages/_app.tsx`)

| Що | Де використовується |
|----|---------------------|
| `Layout` | Огортає **усі** сторінки (index, tools, investigation, graph, history, security, settings, terminal) |
| `ApiErrorHandler` | Глобальний — слухає `api-error` CustomEvent |
| `ThemeProvider` | Глобальна тема для всього додатку |
| `theme.palette.primary.main` | `#00d4aa` — використовується в Layout, tools, graph, investigation, security |

**Не змінюй без перевірки**: `theme`, `Layout` (структура children), `AuthProvider`.

---

## 2. Layout (`components/Layout.tsx`)

| Що | Де використовується |
|----|---------------------|
| `LayoutProps` | Тільки тут — `children: React.ReactNode` |
| `menuItems` | Внутрішній — `/`, `/investigation`, `/tools`, `/graph`, `/terminal`, `/history` |
| `secondaryItems` | Внутрішній — `/settings`, `/security` |
| `drawerWidthOpen`, `drawerWidthClosed` | Тільки тут — 260px, 72px |
| `theme.palette.primary.main` | Avatar, активний пункт меню, бренд |

**Стилі, що дублюються в pages**:
- `bgcolor: '#111827'` — drawer, investigation panels, security Paper
- `bgcolor: '#0a0e17'` — root Box
- `rgba(0, 212, 170, 0.15)` — active menu background

**Потенційні регресії**: якщо змінити `drawerWidth` — перевірити `AppBar` та `main` padding.

---

## 3. Components

### ErrorBoundary (`components/ErrorBoundary.tsx`)
- **Використовується**: тільки в `pages/graph.tsx` (обгортає Cytoscape)
- **Props**: `children`, `fallback?` (опціональний fallback UI)
- **Не змінюй**: `getDerivedStateFromError`, `componentDidCatch` — стандартна логіка ErrorBoundary

### ApiErrorHandler (`components/ApiErrorHandler.tsx`)
- **Використовується**: в `_app.tsx` — глобальний
- **Слухає**: `window.addEventListener('api-error', handler)`
- **Payload**: `e.detail?.message` — string

---

## 4. Pages → Dependencies

| Page | Layout | ErrorBoundary | Shared styles |
|------|--------|---------------|---------------|
| `index.tsx` | ✓ | — | Container, text.primary |
| `tools.tsx` | ✓ | — | primary.main, Container, Chip grid |
| `investigation.tsx` | ✓ | — | #111827, primary.main, Paper |
| `graph.tsx` | ✓ | ✓ | #00d4aa (nodeTypeColors), primary.main |
| `history.tsx` | ✓ | — | — |
| `security.tsx` | ✓ | — | #111827, Paper |
| `settings.tsx` | ✓ | — | — |
| `terminal.tsx` | ✓ | — | — |

---

## 5. Shared Design Tokens (з DESIGN_SYSTEM.md)

| Токен | Значення | Де використовується |
|-------|----------|---------------------|
| `#0a0e17` | Основний фон | _app theme, Layout root |
| `#111827` | Paper | Layout drawer, investigation, security, tools cards |
| `#00d4aa` | Primary | theme.primary.main, graph nodeTypeColors.person |
| `rgba(255,255,255,0.08)` | Border | investigation, security Paper |
| `rgba(0, 212, 170, 0.15)` | Active | Layout menu, tools category chip |

**Правило**: Змінюй кольори в `_app.tsx` theme — вони автоматично застосуються в `primary.main`, `background.default`, `background.paper`. Тверді hex коди (#111827, #0a0e17) в Layout та pages — потрібно перевіряти вручну.

---

## 6. API / lib

| Шлях | Використовується в |
|------|--------------------|
| `lib/api` | tools.tsx, investigation.tsx, (інші pages) |

---

## 7. Checklist перед зміною

- [ ] Змінивши `Layout` — перевірити всі 8 pages (index, tools, investigation, graph, history, security, settings, terminal)
- [ ] Змінивши `theme` в _app — перевірити всі `primary.main`, `background.default`, `background.paper`
- [ ] Змінивши `ErrorBoundary` — перевірити graph.tsx
- [ ] Змінивши `LayoutProps` — перевірити _app.tsx (передає children)
- [ ] Змінивши `quickChipStyle` або інші локальні стилі в tools.tsx — тільки tools.tsx (інших не торкається)
- [ ] Змінивши `nodeTypeColors` в graph.tsx — тільки graph.tsx
