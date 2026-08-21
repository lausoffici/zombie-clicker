# Zombie Clicker — Cuentas y save en la nube (Supabase)

> **For agentic workers:** Implement **one Task at a time**. Do not ask clarifying questions — all product decisions are locked below. If blocked by a missing file/ID, fail the task with a short summary; do not invent new systems outside this plan. Use checkbox (`- [ ]`) tracking. After each task that touches `game.js`: `node tests/logic.test.js` must pass.

**Goal:** Cuentas opcionales (email + contraseña + apodo) con sync del save a Supabase, sin dejar de jugar como invitado en `localStorage`. Leaderboard UI fuera de scope.

**Architecture:** Vanilla. `game.js` = lógica pura + merge helpers. `cloud.js` = Auth/pull/push (noop sin config). `ui.js` = modal + dual-write. Schema en `supabase/schema.sql` (el humano lo pega en SQL Editor). SDK por CDN. Sin npm.

**Tech Stack:** HTML5, CSS3, JavaScript, localStorage, Supabase (BaaS). Sin frameworks, sin build, sin sonidos, sin backend propio.

---

## Locked Decisions (NO preguntar)

1. **Stack:** Supabase Auth + Postgres + RLS. Anon key en el cliente. Nunca `service_role` en el frontend.
2. **Invitado primero:** se juega sin cuenta. La cuenta es opt-in.
3. **Auth:** email + contraseña (mín. 8) + apodo 3–16 `^[A-Za-z0-9_]+$`, único case-insensitive.
4. **Confirm email:** OFF en el proyecto (MVP). Si está ON, mostrar “Revisá tu email”.
5. **Conflicto:** más progreso, no más reciente: `prestige.totalSoulsEarned` → `totalBrainsEarned` → `lastSaved`. Save fresco (0 cerebros ganados, 0 clicks, 0 almas totales) pierde. Nube vacía → subir local.
6. **Caché:** `localStorage` siempre. Nube espejo con sesión.
7. **Reset / import** con sesión también pisan la nube.
8. **Sign out:** no borra local ni nube.
9. **Leaderboard:** no UI. Schema sí (`display_name` único + stats denormalizados). Sin SELECT público de `payload`.
10. **Anti-cheat:** fuera de scope.
11. **No tocar** balance, catálogos, shop patch-render.
12. **UI en español.**
13. **HTTP obligatorio** para la nube (`file://` rompe el SDK).

## Global Constraints

- Sin npm deps para el juego. CDN: `@supabase/supabase-js@2`.
- `node tests/logic.test.js` tras tocar `game.js`.
- `config.js` gitignored; commitear `config.example.js`.
- Una Task por run. No ampliar scope.

## File Structure

| File | Responsibility |
|------|----------------|
| `supabase/schema.sql` | Tablas, RLS, trigger, RPC apodo |
| `config.example.js` | Plantilla URL + anon key |
| `cloud.js` | Cliente Auth + saves |
| `game.js` | Helpers de merge/validación |
| `ui.js` | Modal, merge al login, dual-write |
| `index.html` | Botón cuenta, modal, scripts |
| `style.css` | Overlay cuenta |
| `tests/logic.test.js` | Tests sin red |
| `docs/superpowers/specs/2026-08-21-accounts-supabase.md` | Spec + setup humano |

## Task 0 (HUMANA — no la ejecuta el modelo)

Crear proyecto Supabase. Email provider ON, Confirm email OFF. Site URL `http://localhost:8000`. Pegar `supabase/schema.sql`. Copiar URL + anon key a `config.js`. Servir con `python -m http.server 8000`.

---

### Task 1: Schema SQL + config de ejemplo

**Files:** Create `supabase/schema.sql`, `config.example.js`, `.gitignore` (`config.js`)

- [ ] `profiles` (id, display_name, checks, unique lower)
- [ ] `saves` (payload jsonb, stats denormalizados)
- [ ] RLS: saves own-only; profiles select público (tabla solo nombres) + insert/update own
- [ ] RPC `display_name_taken(text)` para anon
- [ ] Trigger `auth.users` insert → fila vacía en `saves`
- [ ] `config.example.js` con placeholders `YOUR-PROJECT` / `YOUR-ANON-KEY`

**Done when:** el SQL es pegable de una vez; el ejemplo no tiene secretos reales.

---

### Task 2: Helpers en game.js + tests

**Files:** `game.js`, `tests/logic.test.js`

- [ ] `isValidDisplayName`, `isFreshState`, `pickPreferredSave`, `cloudStatsFromState`
- [ ] Tests: apodo ok/corto/largo/espacios/unicode; fresh; nube vacía → local; local fresco vs nube; más almas ganan; empate → lastSaved; cloudStats mapea campos
- [ ] `node tests/logic.test.js` pasa

**Done when:** los 4 helpers están en `Game` y los tests nuevos pasan.

---

### Task 3: cloud.js

**Files:** Create `cloud.js`

- [ ] Noop si no hay config o no hay `window.supabase.createClient`
- [ ] `init`, `signUp`, `signIn`, `signOut`, `getSession`, `hasSession`, `onAuthChange`, `getProfile`, `pullSave`, `pushSave`
- [ ] `pullSave` trata `payload {}` como null
- [ ] Errores de Auth en español
- [ ] Cero DOM. Cero cambios de balance.

**Done when:** `cloud.js` se carga sin config y no tira.

---

### Task 4: UI cuenta + dual-write

**Files:** `index.html`, `style.css`, `ui.js`

- [ ] Scripts: `config.js` → CDN supabase-js@2 → `game.js` → `cloud.js` → `ui.js`
- [ ] `#btn-account` + `#account-name` antes de `#btn-save`
- [ ] Modal crear/entrar / sesión / “nube no configurada”
- [ ] `saveGame` escribe local y, con sesión, `Cloud.pushSave` fire-and-forget
- [ ] `init`: load local → Cloud.init → si sesión, pull + `pickPreferredSave` → **después** progreso offline
- [ ] Reset e import empujan nube vía `saveGame`
- [ ] Toasts canónicos del spec
- [ ] `node tests/logic.test.js` pasa

**Done when:** invitado funciona sin config; con config el modal no tapa el juego al cerrar.

---

### Task 5: Docs

**Files:** `AGENTS.md`, `docs/WORKFLOW.md`, `COMO-JUGAR.md`, spec

- [ ] “sin backend propio”; persistencia local + Supabase opcional
- [ ] Cómo jugar: HTTP, invitado vs cuenta

**Done when:** un agente nuevo no asume “prohibido cualquier red”.
