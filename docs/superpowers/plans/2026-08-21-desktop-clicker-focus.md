# Zombie Clicker — Desktop: clicker + score como centro de atención

> **For agentic workers:** Implement **one Task at a time**. Do not ask clarifying questions — all product decisions are locked below. If blocked by a missing file/ID, fail the task with a short summary; do not invent new systems outside this plan. Use checkbox (`- [ ]`) tracking. After each task: `node tests/logic.test.js` must pass.

**Goal:** En desktop, el centro de atención es la columna del clicker: número de cerebros, BPS (`/s`) y el botón zombie. Topbar slim (brand + Almas + actions). Shop/side quedan como paneles secundarios. Estética **Necropolis Arcade**.

**Architecture:** Vanilla HTML/CSS/JS. Score dual-write: `#hero-brains`/`#hero-bps` (clicker) + `#stat-brains`/`#stat-bps` (topbar, oculto en desktop ≥1024px). Sin tocar `game.js` salvo que un test lo exija. Sin balance changes.

**Tech Stack:** HTML5, CSS3, JavaScript ES5/IIFE, localStorage. Sin frameworks, sin build, sin sonidos, sin backend.

**Executor:** OpenCode + `ollama/qwen3.8-agent:27b`. Orchestrator = Cursor/Kimi (no implementar el plan entero).

---

## Locked Decisions (NO preguntar)

1. **Héroe desktop:** stack vertical en `#col-clicker`: **cerebros (grande) → BPS `/s` → `#zombie-btn` → “+N por click”**.
2. **Topbar desktop (≥1024px):** slim — brand + **Almas** + save/reset/help. **Ocultar** `.topbar-stat--brains` y `.topbar-stat--bps` con CSS. No duplicar visualmente el héroe.
3. **Mobile/tablet (&lt;1024px):** topbar sigue mostrando cerebros/BPS compactos; el stack héroe en clicker **también** existe (mismos IDs).
4. **IDs canónicos:** `#hero-brains` y `#hero-bps` en la columna clicker. `ui.js` actualiza **ambos** pares (hero + topbar).
5. **Grid desktop:** `grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr) minmax(280px, 0.72fr)`; `#main { max-width: 1600px; }`.
6. **Clicker stage:** en desktop, `#clicker-card` sin look de card genérica (border/shadow/panel). Shop/side siguen `.card`. Preservar cosméticos `data-skin` / `data-bg` / auras.
7. **Tipografía:** body = **IBM Plex Sans**; números = **Share Tech Mono**; display = **Creepster** (brand/títulos). Quitar Inter y Roboto Mono del link de Google Fonts del juego.
8. **Motion (solo 3):** (a) idle `zombieBreathe` en `#zombie-btn`, (b) pop `.is-bump` en `#hero-brains` al cambiar texto, (c) flash corto en `#hero-bps` cuando sube. Respetar `prefers-reduced-motion`. Sin librerías.
9. **Sin cambios** de balance, catálogos, prestige logic, ni rewrite del shop patch-render.
10. **`game.js`:** no tocar.
11. **Idioma UI:** español.
12. **Commits:** no hacer commits salvo que el runner pase `--commit`.
13. **Fuera de scope:** sonidos, framework, mobile nav redesign, ilustraciones custom del zombie, rebalance.

## Global Constraints

- Stack vanilla; sin npm deps para el juego.
- Tras cada Task: `node tests/logic.test.js` debe pasar.
- `game.js` = lógica; `ui.js` = DOM; `style.css` = look; `index.html` = estructura.
- Preferir `textContent` / `classList` sobre `innerHTML` wipe.
- Una Task por run de OpenCode. No ampliar scope.

## File Structure

| File | Responsibility |
|------|----------------|
| `index.html` | Markup héroe + fonts Google |
| `style.css` | Grid, stage, topbar slim, tipografía, motion, responsive |
| `ui.js` | Dual-write `#hero-*` + `#stat-*` |
| `game.js` | **No tocar** |
| `COMO-JUGAR.md` / `README.md` | Solo Task 14 si el copy habla del score solo en topbar |

## How to run (OpenCode)

```powershell
cd C:\Users\lauta\zombie-clicker
opencode run -m ollama/qwen3.8-agent:27b --auto --title "desktop-clicker-task-N" "Ejecutá SOLO la Task N del plan docs/superpowers/plans/2026-08-21-desktop-clicker-focus.md. Respetá Locked Decisions. No preguntes. No amplíes scope. Al terminar corré: node tests/logic.test.js"
```

Reemplazar `N` por el número de Task (1–15).

---

### Task 1: Markup héroe en clicker

**Files:**

- Modify: `index.html` (bloque `#clicker-area`)
- Test: `node tests/logic.test.js`

**Contexto:** Hoy `#clicker-area` solo tiene `#zombie-btn` y `#clicker-info`. Hay que insertar el score **arriba** del botón. Dejar `#topbar-stats` intacto.

- [ ] **Step 1: Insertar `#hero-score` en `index.html`**

Dentro de `#clicker-area`, **antes** de `#zombie-btn`, reemplazar el interior de `#clicker-area` por:

```html
          <div id="clicker-area">
            <div id="hero-score">
              <div class="hero-stat hero-stat--brains">
                <span class="hero-stat-label">Cerebros</span>
                <span id="hero-brains" class="hero-stat-value">0</span>
              </div>
              <div class="hero-stat hero-stat--bps">
                <span class="hero-stat-label">Por segundo</span>
                <span id="hero-bps" class="hero-stat-value">0/s</span>
              </div>
            </div>
            <button id="zombie-btn" aria-label="Ganar cerebro">
              <span id="zombie-icon">🧟</span>
            </button>
            <div id="clicker-info">
              <div id="click-value">+1 por click</div>
              <div id="click-hint">Haz clic para ganar cerebros</div>
            </div>
          </div>
```

- [ ] **Step 2: Verificar**

Run: `node tests/logic.test.js`  
Expected: tests pasan. IDs `#hero-brains` y `#hero-bps` existen en el HTML. No tocar CSS ni `ui.js` en esta Task.

**Done when:** markup presente; topbar intacto; tests OK.

---

### Task 2: `ui.js` dual-write de stats

**Files:**

- Modify: `ui.js` (`renderHeader`)
- Test: `node tests/logic.test.js`

**Contexto:** `renderHeader` (~línea 230) solo setea `#stat-brains`, `#stat-bps`, `#stat-souls` vía `setStatText`.

- [ ] **Step 1: Ampliar `renderHeader`**

```js
  function renderHeader() {
    if (!state) return;
    const brainsText = formatNumber(state.brains);
    const bpsText = formatNumber(Game.getBrainsPerSecond(state)) + "/s";
    setStatText($("stat-brains"), brainsText);
    setStatText($("stat-bps"), bpsText);
    setStatText($("hero-brains"), brainsText);
    setStatText($("hero-bps"), bpsText);
    setStatText($("stat-souls"), formatNumber(state.prestige.souls));
  }
```

`setStatText` ya hace bump con `.is-bump` solo cuando el texto cambia — no cambiar esa función salvo null-safety (ya tiene `if (!el) return`).

- [ ] **Step 2: Verificar**

Run: `node tests/logic.test.js`  
Abrir juego: al clickear, `#hero-brains` y `#stat-brains` deben mostrar el mismo valor.

**Done when:** dual-write funciona; tests OK. No CSS en esta Task.

---

### Task 3: Grid desktop dominante

**Files:**

- Modify: `style.css` (`.main-grid`, `#main`, `#clicker-card`)
- Test: `node tests/logic.test.js`

- [ ] **Step 1: Actualizar `#main` y `.main-grid`**

En `style.css`, sección Main grid:

```css
#main {
  flex: 1;
  padding: 18px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

.main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr) minmax(280px, 0.72fr);
  gap: 18px;
  align-items: start;
}
```

- [ ] **Step 2: Min-height del clicker en desktop**

Añadir (fuera de media queries mobile, o en `@media (min-width: 1024px)`):

```css
@media (min-width: 1024px) {
  #clicker-card {
    min-height: calc(100vh - 120px);
  }
}
```

No cambiar breakpoints mobile en esta Task.

- [ ] **Step 3: Verificar**

Run: `node tests/logic.test.js`

**Done when:** columna izquierda más ancha en desktop; tests OK.

---

### Task 4: Topbar slim desktop

**Files:**

- Modify: `style.css`
- Test: `node tests/logic.test.js`

- [ ] **Step 1: Ocultar cerebros/BPS en desktop**

Añadir:

```css
@media (min-width: 1024px) {
  .topbar-stat--brains,
  .topbar-stat--bps {
    display: none;
  }
  #topbar {
    min-height: 56px;
    padding: 10px 18px;
  }
  #topbar-stats {
    justify-content: flex-end;
    flex: 0 1 auto;
    gap: 16px;
  }
}
```

- [ ] **Step 2: Verificar**

&lt;1024px: `.topbar-stat--brains` y `--bps` siguen visibles (no añadir `display:none` fuera del media query).  
Run: `node tests/logic.test.js`

**Done when:** desktop sin score duplicado en header; mobile/tablet topbar completo; tests OK.

---

### Task 5: Tipografía Necropolis Arcade

**Files:**

- Modify: `index.html` (link Google Fonts)
- Modify: `style.css` (`:root` font variables)
- Test: `node tests/logic.test.js`

- [ ] **Step 1: Reemplazar link de fonts en `index.html`**

Sustituir el `<link href="https://fonts.googleapis.com/css2?...">` actual por:

```html
<link href="https://fonts.googleapis.com/css2?family=Creepster&family=IBM+Plex+Sans:wght@400;500;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Variables CSS**

```css
  --font-display: 'Creepster', 'Impact', fantasy, sans-serif;
  --font-body: 'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'Share Tech Mono', 'Consolas', monospace;
```

- [ ] **Step 3: Verificar**

Buscar en el repo del juego: no debe quedar `Inter` ni `Roboto Mono` en `index.html` / `style.css` del juego (dashboard.html puede ignorarse si no es parte del juego principal).  
Run: `node tests/logic.test.js`

**Done when:** tipografía nueva cargada; tests OK.

---

### Task 6: Estilos del stack héroe

**Files:**

- Modify: `style.css`
- Test: `node tests/logic.test.js`

- [ ] **Step 1: Añadir estilos `#hero-score`**

```css
#hero-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  margin-bottom: 8px;
}
.hero-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.hero-stat-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1.5px;
}
.hero-stat--brains .hero-stat-value {
  font-family: var(--font-mono);
  font-size: clamp(40px, 5vw, 72px);
  font-weight: 700;
  color: var(--green-300);
  letter-spacing: -0.03em;
  line-height: 1.05;
}
.hero-stat--bps .hero-stat-value {
  font-family: var(--font-mono);
  font-size: clamp(18px, 2.2vw, 28px);
  font-weight: 700;
  color: var(--text-secondary);
  line-height: 1.1;
}
#clicker-area {
  gap: 22px;
}
```

Si `#clicker-area` ya define `gap`, unificar (no duplicar reglas contradictorias).

- [ ] **Step 2: Verificar**

Run: `node tests/logic.test.js`

**Done when:** el número es lo más grande de la columna clicker; tests OK.

---

### Task 7: Clicker como stage (de-cardify desktop)

**Files:**

- Modify: `style.css`
- Test: `node tests/logic.test.js`

- [ ] **Step 1: Stage desktop**

```css
@media (min-width: 1024px) {
  #clicker-card.card {
    background:
      radial-gradient(ellipse at 50% 35%, rgba(127, 191, 63, 0.10) 0%, transparent 55%),
      radial-gradient(ellipse at 50% 80%, rgba(0, 0, 0, 0.35) 0%, transparent 60%),
      transparent;
    border: none;
    box-shadow: none;
    position: relative;
    overflow: hidden;
  }
  #clicker-card.card::before {
    content: "";
    position: absolute;
    inset: 0;
    opacity: 0.04;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    z-index: 0;
  }
  #clicker-area,
  #click-particles {
    position: relative;
    z-index: 1;
  }
}
```

- [ ] **Step 2: Cosméticos**

No romper selectores existentes `#clicker-card[data-bg="bg-fog"]` etc. Si el stage pone `background` en desktop, los `data-bg` deben seguir pudiendo overlay (dejar que las reglas de cosméticos ganen por especificidad o `!` no usar — preferir que cosméticos se apliquen encima en el mismo `#clicker-card`).

Regla locked: si hay conflicto, **cosméticos `data-bg` pisan el fondo del stage** cuando están activos.

- [ ] **Step 3: Verificar**

Run: `node tests/logic.test.js`  
Shop/side siguen con borde/sombra de `.card`.

**Done when:** clicker se siente escenario en desktop; cosméticos no rotos; tests OK.

---

### Task 8: Botón zombie más imponente

**Files:**

- Modify: `style.css`
- Test: `node tests/logic.test.js`

- [ ] **Step 1: Tamaño desktop**

```css
@media (min-width: 1024px) {
  #zombie-btn {
    width: 310px;
    height: 310px;
  }
  #zombie-icon {
    font-size: 140px;
  }
}
```

Mantener `:hover`, `:active`, `.popping` existentes. Glow solo verde/rojo/oro del tema — no purple.

- [ ] **Step 2: Verificar**

Run: `node tests/logic.test.js`  
Mobile (&lt;768) debe seguir con tamaños mobile existentes (`190px` / `82px`).

**Done when:** botón grande en desktop; mobile intacto; tests OK.

---

### Task 9: Motion idle + score

**Files:**

- Modify: `style.css`
- Modify: `ui.js` solo si hace falta flash BPS (clase `is-bps-flash`)
- Test: `node tests/logic.test.js`

- [ ] **Step 1: CSS breathe + reduced motion**

```css
@keyframes zombieBreathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.025); }
}
@media (prefers-reduced-motion: no-preference) {
  #zombie-btn {
    animation: zombieBreathe 3.2s ease-in-out infinite;
  }
  #zombie-btn:active,
  #zombie-btn.popping {
    animation: zombiePop 0.18s ease;
  }
}
@keyframes bpsFlash {
  0% { color: var(--green-300); }
  100% { color: var(--text-secondary); }
}
.hero-stat-value.is-bps-flash {
  animation: bpsFlash 0.35s ease;
}
```

Si `:active`/`.popping` pelean con breathe, la regla de arriba (reiniciar a `zombiePop`) es la solución locked.

- [ ] **Step 2: Flash BPS en `ui.js` (mínimo)**

En `setStatText` o en `renderHeader`: cuando se actualiza `#hero-bps` y el texto cambia, además de `.is-bump` (opcional en BPS), añadir clase `is-bps-flash` y quitarla al `animationend` o con el mismo trick de reflow que `is-bump`.

Mínimo aceptable: reusar `setStatText` (ya pone `is-bump`) **y** en CSS hacer que `#hero-bps.is-bump` use `bpsFlash` o `countPop`. Preferido locked: `#hero-bps.is-bump { animation: bpsFlash 0.35s ease; }` sin JS extra si alcanza.

- [ ] **Step 3: Verificar**

`prefers-reduced-motion: reduce` → sin breathe.  
Run: `node tests/logic.test.js`

**Done when:** 3 motions del Locked Decision 8; tests OK.

---

### Task 10: Demote visual shop/side

**Files:**

- Modify: `style.css`
- Test: `node tests/logic.test.js`

- [ ] **Step 1: Bajar contraste / altura**

```css
@media (min-width: 1024px) {
  #shop-card .card-title,
  #col-side .card-title {
    font-size: 18px;
    color: var(--text-secondary);
  }
  .shop-tab,
  .side-tab {
    font-size: 12px;
    padding: 8px 10px;
  }
  .shop-list,
  .ach-list,
  .prestige-list {
    max-height: calc(100vh - 220px);
  }
}
```

No cambiar JS ni lógica de tabs.

- [ ] **Step 2: Verificar**

Run: `node tests/logic.test.js`

**Done when:** paneles secundarios más quietos visualmente; tests OK.

---

### Task 11: Tablet (768–1023)

**Files:**

- Modify: `style.css` (`@media (max-width: 1023px)`)
- Test: `node tests/logic.test.js`

- [ ] **Step 1: Asegurar grid 2 cols**

El bloque existente `@media (max-width: 1023px)` ya pone `1fr 1fr` y `#col-side { grid-column: 1 / -1; }`. Verificar que:

- Topbar stats (cerebros/BPS) **visibles** (Task 4 solo oculta ≥1024).
- Hero score en clicker no desborda (`#hero-brains` puede usar un clamp un poco menor si hace falta solo en este breakpoint).

Si hace falta:

```css
@media (max-width: 1023px) and (min-width: 768px) {
  .hero-stat--brains .hero-stat-value {
    font-size: clamp(32px, 4.5vw, 48px);
  }
}
```

- [ ] **Step 2: Verificar**

Run: `node tests/logic.test.js`

**Done when:** tablet no roto; tests OK.

---

### Task 12: Mobile regression

**Files:**

- Modify: `style.css` solo si algo de Tasks 1–11 rompió mobile
- Test: `node tests/logic.test.js`

**Checklist manual (documentar en el summary del run):**

- [ ] `#mobile-nav` sigue `display: flex` bajo 767px
- [ ] Topbar muestra cerebros + BPS
- [ ] `#zombie-btn` ~190px; hero score legible (no overflow horizontal)
- [ ] Tabs Juego / Logros / Prestigio / Stats siguen funcionando

Ajustes CSS mínimos permitidos, por ejemplo:

```css
@media (max-width: 767px) {
  .hero-stat--brains .hero-stat-value {
    font-size: clamp(28px, 8vw, 40px);
  }
  .hero-stat--bps .hero-stat-value {
    font-size: 16px;
  }
}
```

**Done when:** checklist OK; tests OK; sin rediseñar mobile nav.

---

### Task 13: A11y mínima del héroe

**Files:**

- Modify: `index.html`
- Test: `node tests/logic.test.js`

- [ ] **Step 1: aria-live**

En `#hero-brains` (Task 1 markup), asegurar:

```html
<span id="hero-brains" class="hero-stat-value" aria-live="polite">0</span>
```

No quitar `aria-label` de `#zombie-btn`.

- [ ] **Step 2: Verificar**

Run: `node tests/logic.test.js`

**Done when:** aria-live presente; focus/click del zombie intactos; tests OK.

---

### Task 14: Docs alineados

**Files:**

- Modify: `COMO-JUGAR.md` y/o `README.md` **solo si** dicen que el score vive únicamente en la barra superior

- [ ] **Step 1: Buscar y alinear**

Copy canónico locked:

> En **desktop**, cerebros y cerebros/segundo se muestran en la zona del clicker (junto al zombie). En **móvil/tablet**, también aparecen en la barra superior para verlos al cambiar de pestaña. Las Almas siguen en la barra superior.

- [ ] **Step 2: Verificar**

Run: `node tests/logic.test.js`

**Done when:** docs coherentes o confirmado “no changes needed” en el summary.

---

### Task 15: QA checklist final

**Files:** solo fixes mínimos si algo de 1–14 quedó roto

**Checklist:**

- [ ] Desktop 1280 / 1440 / 1920: héroe (número + BPS + botón) es lo primero que se lee
- [ ] Topbar desktop: sin cerebros/BPS; con Almas + actions
- [ ] Cosméticos skin / aura / bg siguen aplicándose
- [ ] Shop hover + x1/x10/Max siguen estables (sin wipe en loop)
- [ ] `node tests/logic.test.js` verde
- [ ] Marcar checkboxes de Tasks 1–14 completadas en este archivo si el trabajo está hecho

**Done when:** checklist completo; tests verdes; summary corto de lo verificado.

---

## Execution notes (orchestrator)

- Lanzar **una** Task por `opencode run`.
- Al volver: `git diff` + checklist de la Task + tests.
- Si Qwen se traba: diagnosticar Ollama/modelo/permisos; relanzar OpenCode; **no** implementar la feature vos en modo AFK.
