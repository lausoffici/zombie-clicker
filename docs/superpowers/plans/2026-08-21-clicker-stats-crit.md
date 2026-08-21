# Zombie Clicker — Stats de click en la zona del clicker (crítico + payout)

> **For agentic workers:** Implement **one Task at a time**. Do not ask clarifying questions — all product decisions are locked below. If blocked by a missing file/ID, fail the task with a short summary; do not invent new systems outside this plan. Use checkbox (`- [ ]`) tracking. After each task that touches logic: `node tests/logic.test.js` must pass.

**Goal:** En `#clicker-info` (debajo del zombie), mostrar datos útiles del click: valor normal, chance de crítico y payout del crítico. Sin tocar balance ni `game.js` salvo exports ya existentes.

**Architecture:** Vanilla. Solo UI: `index.html` estructura, `ui.js` actualiza textos en `renderClicker`, `style.css` layout compacto. Usa `Game.getClickValue` y `Game.getCritChance` (ya exportados).

**Tech Stack:** HTML5, CSS3, JavaScript ES5/IIFE. Sin frameworks, sin build, sin sonidos, sin backend.

**Executor:** Ollama AFK loop / OpenCode + `qwen3.8-agent:27b`. Orchestrator = Cursor/Kimi.

---

## Locked Decisions (NO preguntar)

1. **Dónde:** dentro de `#clicker-info`, debajo de `#click-value`, encima de `#click-hint`.
2. **Qué mostrar (siempre visible, UI español):**
   - `#click-value` (ya existe): `+{N} por click` con `Game.getClickValue(state)`.
   - `#click-crit`: `Crítico {P}% · ×10` donde `P = Math.round(Game.getCritChance(state) * 100)`.
   - `#click-crit-value`: `+{N} en crítico` donde `N = formatNumber(getClickValue * 10)`.
3. **Sin crítico (chance 0):** igual mostrar las dos líneas (`Crítico 0% · ×10` y `+{click×10} en crítico`) para que el jugador descubra la mecánica.
4. **No agregar** en esta zona: BPS, cerebros, almas, multiplicador global, auto-click, total clicks, cheaper. Esos viven en héroe/topbar/side.
5. **Actualización:** solo en `renderClicker()` (misma ruta que ya refresca `#click-value`). Evitar rewrite de `innerHTML` de `#clicker-info`; usar `textContent` en los nodos por id.
6. **Estilo:** fila compacta `.clicker-stats` con las dos líneas nuevas; tipografía mono para números; color muted para labels/crítico, teal para valores; no cards nuevas; no badges flotantes sobre el zombie.
7. **`game.js`:** no tocar (API ya tiene `getCritChance` / `getClickValue`).
8. **Tests:** `node tests/logic.test.js` debe seguir pasando (sin cambios de lógica esperados).
9. **Docs:** una línea en `COMO-JUGAR.md` sección Click mencionando que la zona del zombie muestra valor, crítico % y payout.
10. **Commits:** no hacer commits salvo que el runner pase `--commit`.
11. **Fuera de scope:** partículas de crítico, animaciones nuevas, balance, prestige, shop.

## Global Constraints

- Vanilla HTML/CSS/JS; `ui.js` = DOM; `style.css` = look; `index.html` = estructura.
- Preferir `textContent` / `classList` sobre wipe de `innerHTML`.
- Una Task por run. No ampliar scope.

## File Structure (touched)

- Modify: `index.html` — nodos `#click-crit`, `#click-crit-value` dentro de `#clicker-info`
- Modify: `ui.js` — `renderClicker()`
- Modify: `style.css` — `.clicker-stats` / `#click-crit` / `#click-crit-value`
- Modify: `COMO-JUGAR.md` — mención breve

---

### Task 1: Markup en clicker-info

**Files:** `index.html`

- [ ] Dentro de `#clicker-info`, después de `#click-value` y antes de `#click-hint`, agregar:

```html
<div class="clicker-stats" aria-live="polite">
  <div id="click-crit">Crítico 0% · ×10</div>
  <div id="click-crit-value">+10 en crítico</div>
</div>
```

- [ ] No mover `#hero-score`, `#zombie-btn` ni `#click-hint`.

**Done when:** IDs existen en el HTML; estructura de `#clicker-info` = click-value → clicker-stats → click-hint.

---

### Task 2: renderClicker actualiza crítico

**Files:** `ui.js`

- [ ] En `renderClicker()`, además de `#click-value`:
  - leer `const clickVal = Game.getClickValue(state)`;
  - leer `const critChance = Game.getCritChance(state)`;
  - `#click-crit`.textContent = `"Crítico " + Math.round(critChance * 100) + "% · ×10"`;
  - `#click-crit-value`.textContent = `"+" + formatNumber(clickVal * 10) + " en crítico"`;
- [ ] Guard null-safe (`if (el)`).
- [ ] No tocar `handleClick` ni lógica de partículas.

**Done when:** al comprar/nivelar `golpe-critico`, el % sube en vivo; el payout crítico es 10× el click mostrado.

---

### Task 3: Estilos compactos

**Files:** `style.css`

- [ ] `.clicker-stats { margin-top: 6px; display: flex; flex-direction: column; gap: 2px; }`
- [ ] `#click-crit`, `#click-crit-value`: font mono, size ~12–13px, weight 600
- [ ] `#click-crit`: color `var(--text-muted)` o similar existente
- [ ] `#click-crit-value`: color `var(--teal-300)` o acento existente (coherente con `#click-value`)
- [ ] No romper layout del zombie ni desktop hero stack.

**Done when:** las dos líneas se leen claras bajo “+N por click” sin empujar el botón fuera de viewport en mobile.

---

### Task 4: Docs + verify

**Files:** `COMO-JUGAR.md`

- [ ] En la sección Click, agregar que debajo del zombie se ven valor por click, % de crítico y cerebros del crítico.
- [ ] Correr: `node tests/logic.test.js` (debe pasar).

**Done when:** doc actualizado y suite verde.

---

## Execution notes

```powershell
cd C:\Users\lauta\zombie-clicker
.\scripts\run-opencode-plan.ps1 -Plan docs/superpowers/plans/2026-08-21-clicker-stats-crit.md -From 1 -To 4
# o:
node scripts/execute-plan-ollama.mjs --plan docs/superpowers/plans/2026-08-21-clicker-stats-crit.md --from 1 --to 4 --no-commit
```
