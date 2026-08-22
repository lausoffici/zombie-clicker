# Zombie Clicker — Ranking global (leaderboard)

> **For agentic workers:** Implement **one Task at a time**. Do not ask clarifying questions — all product decisions are locked below. If blocked by a missing file/ID, fail the task with a short summary; do not invent new systems outside this plan. Use checkbox (`- [ ]`) tracking. After each task that touches `game.js`: `node tests/logic.test.js` must pass.

**Goal:** Pestaña Ranking que lista el top 50 de jugadores con cuenta (apodo, almas, cerebros totales, mejor BPS), vía RPC público de Supabase. Sin exponer `payload`.

**Architecture:** Vanilla. Schema añade RPC `get_leaderboard`. `cloud.js` lo llama. `ui.js` renderiza tabla al abrir la pestaña. `game.js` corrige `cloudStatsFromState` para subir el nivel permanente de almas.

**Tech Stack:** HTML5, CSS3, JavaScript ES5/IIFE, Supabase RPC. Sin frameworks, sin build, sin sonidos, sin backend propio.

**Executor:** Ollama AFK loop / OpenCode + `qwen3.8-agent:27b`. Orchestrator = Cursor/Kimi.

**Written against commit:** `fae3e96`

**Spec:** `docs/superpowers/specs/2026-08-21-ranking-leaderboard.md`

---

## Locked Decisions (NO preguntar)

1. Ranking **público** (anon + authenticated). Login no requerido para mirar.
2. Orden: `prestige_souls DESC`, `total_brains_earned DESC`, `best_bps DESC`.
3. Límite: **50** filas (`p_limit` clamp 1–100; default 50 desde el cliente).
4. Columnas UI: `#` | Apodo | Almas | Cerebros | Mejor BPS.
5. `prestige_souls` = `state.prestige.totalSoulsEarned` (nivel permanente). Fix `cloudStatsFromState` si hoy usa `prestige.souls`.
6. Anti-cheat fuera de scope. Disclaimer UI: “Las stats las reporta cada jugador.”
7. UI: nueva side-tab **Ranking** + mobile-tab **Ranking**. No meter el ranking dentro del panel Stats.
8. Fetch al **abrir** la pestaña Ranking (y botón Actualizar). No poll cada frame.
9. Sin config / error / vacío: mensajes en español; el juego sigue jugable.
10. Resaltar fila del usuario logueado (`Cloud.hasSession` + comparar `display_name` con `#account-name` / profile cache).
11. RPC `SECURITY DEFINER` + `search_path = public`. **Nunca** devolver `payload`.
12. No tocar balance, catálogos, shop, prestige formula, cosmetics.
13. UI en español. Commits solo si el runner pasa `--commit`.
14. Una Task por run. No ampliar scope.

## Global Constraints

- Vanilla HTML/CSS/JS; `game.js` lógica; `ui.js` DOM; `cloud.js` nube; `style.css` look; `index.html` estructura.
- `node tests/logic.test.js` tras tocar `game.js`.
- Preferir `textContent` / `createElement` sobre wipe innecesario de paneles ajenos.
- Schema idempotente (`create or replace function`).

## File Structure (touched)

| File | Responsibility |
|------|----------------|
| `supabase/schema.sql` | RPC `get_leaderboard` + grant execute |
| `game.js` | Fix `cloudStatsFromState` |
| `tests/logic.test.js` | Test del fix |
| `cloud.js` | `fetchLeaderboard` |
| `index.html` | Tab + panel Ranking |
| `ui.js` | Wire tabs, fetch, render |
| `style.css` | Tabla ranking |
| `COMO-JUGAR.md` | Cómo usar Ranking |
| `docs/superpowers/specs/2026-08-21-ranking-leaderboard.md` | Ya existe — no reescribir salvo typo |

## Task 0 (HUMANA — no la ejecuta el modelo)

Tras Task 1, en Supabase SQL Editor: re-pegar el contenido completo actualizado de `supabase/schema.sql` (o al menos el bloque del nuevo RPC) para que `get_leaderboard` exista en el proyecto.

---

### Task 1: RPC `get_leaderboard` en schema

**Files:** `supabase/schema.sql`

- [ ] Al final del archivo (después de los grants existentes), agregar:

```sql
create or replace function public.get_leaderboard(p_limit integer default 50)
returns table (
  rank bigint,
  display_name text,
  prestige_souls integer,
  total_brains_earned double precision,
  best_bps double precision
)
language sql
stable
security definer
set search_path = public
as $$
  select
    row_number() over (
      order by s.prestige_souls desc,
               s.total_brains_earned desc,
               s.best_bps desc
    ) as rank,
    p.display_name,
    s.prestige_souls,
    s.total_brains_earned,
    s.best_bps
  from public.saves s
  inner join public.profiles p on p.id = s.user_id
  where coalesce(s.total_brains_earned, 0) > 0
     or coalesce(s.prestige_souls, 0) > 0
     or coalesce(s.best_bps, 0) > 0
  order by s.prestige_souls desc,
           s.total_brains_earned desc,
           s.best_bps desc
  limit greatest(1, least(coalesce(p_limit, 50), 100));
$$;

grant execute on function public.get_leaderboard(integer) to anon, authenticated;
```

- [ ] No cambiar RLS de `saves` (sigue own-only). No exponer `payload` en el RETURN.
- [ ] Mantener el resto del schema intacto (profiles, saves, display_name_taken, trigger).

**Done when:** el SQL sigue siendo pegable de una vez; la función no selecciona `payload`.

---

### Task 2: Fix `cloudStatsFromState` + test

**Files:** `game.js`, `tests/logic.test.js`

Estado actual (aprox. líneas 765–774 de `game.js`): usa `state.prestige.souls`. Debe usar el nivel permanente.

- [ ] En `cloudStatsFromState`, setear:
  - `prestige_souls: totalSoulsEarned(state)` (helper interno ya existente), **o** `getSoulLevel(state)` si es equivalente.
  - Dejar `total_brains_earned` y `best_bps` igual.
- [ ] Actualizar el test `testCloudStatsFromState` en `tests/logic.test.js`:
  - Construir un state con `prestige.totalSoulsEarned = 7` (y opcionalmente `prestige.souls` distinto o ausente).
  - Assert `stats.prestige_souls === 7`.
  - Mantener asserts de brains/bps.
- [ ] Correr: `node tests/logic.test.js` — debe pasar.

**Done when:** push a la nube reporta almas permanentes; el test lo prueba sin red.

---

### Task 3: `Cloud.fetchLeaderboard`

**Files:** `cloud.js`

- [ ] Agregar función `fetchLeaderboard(limit)`:
  - Si `!client` → `Promise.resolve({ ok: false, rows: [], error: "Nube no configurada" })`.
  - `lim =` número entre 1 y 100; default 50 si inválido.
  - `client.rpc("get_leaderboard", { p_limit: lim })`.
  - Si `res.error` → `{ ok: false, rows: [], error: translateAuthError(res.error) || "No se pudo cargar el ranking" }`.
  - Si ok → mapear cada fila a objeto plano:
    `{ rank, displayName, prestigeSouls, totalBrainsEarned, bestBps }`
    (leer tanto snake_case del RPC como fallbacks numéricos con `|| 0` / `|| ""`).
  - Return `{ ok: true, rows: mapped }`.
- [ ] Exportar en el objeto `Cloud`: `fetchLeaderboard: fetchLeaderboard`.
- [ ] Cero DOM. No tocar `pushSave` salvo que haga falta por el fix de Task 2 (no debería).

**Done when:** sin config, `fetchLeaderboard` resuelve sin throw; con client, llama el RPC.

---

### Task 4: Markup Ranking (HTML)

**Files:** `index.html`

- [ ] En `#side-tabs`, después del tab Stats, agregar botón:

```html
<button id="side-tab-ranking" class="side-tab" data-side="ranking">
  <!-- mismo estilo SVG stroke que los otros side-tabs; icono lista/trofeo simple -->
  Ranking
</button>
```

- [ ] Después de `#side-panel-stats`, agregar panel:

```html
<div id="side-panel-ranking" class="side-panel">
  <div class="card">
    <h2 class="card-title">Ranking</h2>
    <p class="ranking-disclaimer">Las stats las reporta cada jugador.</p>
    <div class="ranking-actions">
      <button type="button" id="btn-ranking-refresh" class="btn">Actualizar</button>
    </div>
    <p id="ranking-status" class="ranking-status" aria-live="polite"></p>
    <div id="ranking-list" class="ranking-list" role="table" aria-label="Ranking de jugadores"></div>
  </div>
</div>
```

- [ ] En `#mobile-nav`, agregar tab mobile `data-mobile="ranking"` con label **Ranking** (mismo patrón que stats/prestige).
- [ ] No mover paneles existentes ni cambiar el orden Logros → Prestigio → Stats → Ranking.

**Done when:** IDs existen; pestaña Ranking visible en desktop y mobile markup.

---

### Task 5: UI render + wire

**Files:** `ui.js`, `style.css`

#### ui.js

- [ ] Extender `setupSideTabs` para incluir `{ btn: "side-tab-ranking", panel: "side-panel-ranking" }`.
- [ ] Al hacer click en el tab Ranking (y en mobile ranking): llamar `loadRanking()` (debounce simple: si ya hay fetch en vuelo, no duplicar; o cancelar mentalmente con flag `rankingLoading`).
- [ ] `#btn-ranking-refresh` → `loadRanking()`.
- [ ] `loadRanking()`:
  1. Si `typeof Cloud === "undefined" || !Cloud.fetchLeaderboard`: status = “Nube no disponible.”; vaciar lista; return.
  2. Status = “Cargando…”; disable refresh opcional.
  3. `Cloud.fetchLeaderboard(50).then(...)`.
  4. Si `!ok`: status = error; vaciar lista.
  5. Si `rows.length === 0`: status = “Todavía no hay jugadores en el ranking.”; vaciar lista.
  6. Si ok: status = “Top “ + rows.length; `renderRankingRows(rows)`.
- [ ] `renderRankingRows(rows)`:
  - Limpiar `#ranking-list`.
  - Header fila (clase `.ranking-row.ranking-head`) con spans: `#`, Apodo, Almas, Cerebros, BPS.
  - Por cada row: `.ranking-row` con esos 5 campos; números con `formatNumber` para cerebros/BPS; almas como entero/`formatNumber`.
  - Si el `displayName` de la fila === nombre mostrado del usuario (p.ej. texto de `#account-name` trim, o variable cache de display name ya usada en account UI), agregar clase `.ranking-row-me`.
  - Escape XSS: **no** concatenar `displayName` crudo en `innerHTML`. Usar `textContent` en nodos creados con `createElement`, o escapar `& < > "`.
- [ ] Extender `setupMobileNav` para que `data-mobile="ranking"` muestre el panel ranking (mismo patrón que stats: activar side tab ranking / mostrar col-side). Copiar el patrón existente de `data-mobile="stats"` — no inventar layout nuevo.
- [ ] No llamar `loadRanking` en el tick de 15s ni en `renderAll` cada frame.

#### style.css

- [ ] Estilos mínimos alineados al look Necropolis existente (variables del repo; tipografía mono para números):
  - `.ranking-disclaimer`, `.ranking-status`, `.ranking-actions` (gap como `.stats-actions`)
  - `.ranking-list` scroll si hace falta (`max-height` ~50vh; overflow auto)
  - `.ranking-row` grid 5 columnas (`minmax`); gap chico; padding compacto
  - `.ranking-head` muted / uppercase o weight mayor
  - `.ranking-row-me` borde o background sutil con accent existente (no purple nuevo; usar `--accent` / verde tóxico del tema)
- [ ] Mobile: filas legibles; no cards nuevas innecesarias.

**Done when:** abrir Ranking carga datos (o mensaje claro); Actualizar re-fetch; fila propia resaltada si aplica; `node tests/logic.test.js` pasa.

---

### Task 6: Docs

**Files:** `COMO-JUGAR.md`

- [ ] Agregar sección corta **Ranking** (después de Cuentas / nube si existe, o al final de mecánicas):
  - Requiere servir por HTTP y `config.js`.
  - Pestaña Ranking muestra top 50 por almas, luego cerebros, luego BPS.
  - Solo jugadores con cuenta que hayan sincronizado progreso.
  - Las stats las reporta el cliente (no hay anti-cheat).

**Done when:** un jugador nuevo entiende cómo abrir el ranking sin leer el plan.

---

## Verification (orchestrator)

1. `node tests/logic.test.js` pasa.
2. Humano pegó schema → RPC existe.
3. Con 2+ cuentas de prueba y saves pusheados, Ranking lista orden correcto.
4. Sin `config.js`: mensaje “Nube no configurada” / equivalente, sin crash.
5. Invitado puede ver ranking; logueado ve su fila resaltada si está en top 50.

## Out of scope

- Anti-cheat / firmas server-side
- Paginación infinita / búsqueda por nombre
- Ranking por clicks, huesos, tiempo jugado
- Cambiar RLS para hacer `saves` público
- Commits automáticos
