# Visual Revamp — Necrópolis Premium Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar Zombie Clicker a una estética dark fantasy/horror premium usando solo CSS + SVGs vectoriales inline, sin dependencias.

**Architecture:** Se mantiene la arquitectura vanilla HTML/CSS/JS. El rediseño se aplica actualizando `style.css` con nuevas variables y componentes, `index.html` con el zombie SVG inline y ajustes semánticos, y `ui.js` para renderizar iconos SVG en lugar de emojis. La lógica en `game.js` no cambia.

**Tech Stack:** HTML5, CSS3 (variables, flex/grid, animaciones, SVG data URIs), JavaScript ES5/IIFE (compatibilidad con el estilo actual), SVG inline.

## Global Constraints

- Vanilla HTML/CSS/JS — sin framework, sin build, sin sonidos, sin backend.
- UI en español.
- Sin dependencias externas (solo Google Fonts ya cargadas).
- Animaciones deben respetar `prefers-reduced-motion`.
- `node tests/logic.test.js` debe pasar después de cada tarea.
- No modificar la lógica de juego en `game.js`.
- Mantener compatibilidad con saves existentes en `localStorage`.
- Mantener funcionamiento de cosméticos existentes (`data-skin`, `data-aura`, `data-bg`).

---

## File Structure

| Archivo | Responsabilidad |
|---------|-----------------|
| `style.css` | Variables, texturas, layout, componentes, animaciones, media queries. |
| `index.html` | Estructura semántica, zombie SVG inline, iconos inline donde sea necesario. |
| `ui.js` | Render dinámico de tarjetas con iconos SVG; eventos y animaciones. |
| `game.js` | Sin cambios. |
| `tests/logic.test.js` | Verificación de que la lógica sigue intacta. |

---

## SVG Assets (inline strings)

A continuación se definen strings SVG reutilizables. En `ui.js` se usan como constantes de strings HTML.

```js
const SVG_ZOMBIE = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="zombie-svg" aria-hidden="true"><defs><radialGradient id="zglow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#9aff4d" stop-opacity="0.35"/><stop offset="100%" stop-color="#9aff4d" stop-opacity="0"/></radialGradient><filter id="zshadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.6"/></filter></defs><circle cx="100" cy="105" r="78" fill="url(#zglow)"/><g filter="url(#zshadow)"><ellipse cx="100" cy="100" rx="70" ry="75" fill="#5a6b4f"/><ellipse cx="100" cy="95" rx="60" ry="55" fill="#6e7f62"/><path d="M55 75 Q70 60 85 75" fill="none" stroke="#3a4a32" stroke-width="4" stroke-linecap="round"/><path d="M115 75 Q130 60 145 75" fill="none" stroke="#3a4a32" stroke-width="4" stroke-linecap="round"/><circle cx="72" cy="92" r="14" fill="#1a1f16"/><circle cx="128" cy="92" r="14" fill="#1a1f16"/><circle cx="75" cy="90" r="5" fill="#9aff4d" class="zombie-eye-glow"/><circle cx="131" cy="90" r="5" fill="#9aff4d" class="zombie-eye-glow"/><path d="M75 130 Q100 155 125 130" fill="#2a2018"/><path d="M80 132 L85 142 L90 132 L95 142 L100 132 L105 142 L110 132 L115 142 L120 132" fill="#eef2ea"/><path d="M40 100 L55 95 L40 110" fill="#4a5a40"/><path d="M160 100 L145 95 L160 110" fill="#4a5a40"/><path d="M50 140 Q45 160 60 165" fill="none" stroke="#3a4a32" stroke-width="3" stroke-linecap="round"/><path d="M150 140 Q155 160 140 165" fill="none" stroke="#3a4a32" stroke-width="3" stroke-linecap="round"/></g></svg>`;

const ICONS = {
  save: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
  reset: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
  help: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  achievements: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
  prestige: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  stats: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  survivor: `<svg viewBox="0 0 32 32"><circle cx="16" cy="10" r="5" fill="#8fa085"/><path d="M8 28 L12 14 L20 14 L24 28" fill="#5d705a"/><circle cx="14" cy="10" r="1" fill="#000"/><circle cx="18" cy="10" r="1" fill="#000"/></svg>`,
  biter: `<svg viewBox="0 0 32 32"><ellipse cx="16" cy="16" rx="10" ry="12" fill="#6e7f62"/><circle cx="12" cy="13" r="2" fill="#9aff4d"/><circle cx="20" cy="13" r="2" fill="#9aff4d"/><path d="M11 22 Q16 26 21 22" fill="#2a2018"/></svg>`,
  runner: `<svg viewBox="0 0 32 32"><ellipse cx="16" cy="14" rx="8" ry="9" fill="#6e7f62"/><circle cx="13" cy="12" r="1.5" fill="#9aff4d"/><circle cx="19" cy="12" r="1.5" fill="#9aff4d"/><path d="M8 26 L12 18 L20 18 L24 26" fill="#4a5a40"/></svg>`,
  rabid: `<svg viewBox="0 0 32 32"><ellipse cx="16" cy="15" rx="10" ry="11" fill="#7a4f4f"/><circle cx="12" cy="13" r="2" fill="#e62e2e"/><circle cx="20" cy="13" r="2" fill="#e62e2e"/><path d="M10 24 L16 19 L22 24" fill="#fff"/></svg>`,
  boss: `<svg viewBox="0 0 32 32"><ellipse cx="16" cy="15" rx="11" ry="12" fill="#4a5a40"/><path d="M8 6 L12 12 L16 5 L20 12 L24 6" fill="#9e1b1b"/><circle cx="12" cy="14" r="2" fill="#ffbf00"/><circle cx="20" cy="14" r="2" fill="#ffbf00"/><path d="M11 25 Q16 21 21 25" fill="#2a2018"/></svg>`,
  horde: `<svg viewBox="0 0 32 32"><circle cx="10" cy="18" r="5" fill="#6e7f62"/><circle cx="22" cy="18" r="5" fill="#6e7f62"/><circle cx="16" cy="12" r="5" fill="#5a6b4f"/><circle cx="12" cy="12" r="1" fill="#9aff4d"/><circle cx="20" cy="12" r="1" fill="#9aff4d"/></svg>`,
  necro: `<svg viewBox="0 0 32 32"><path d="M4 28 L8 10 L16 6 L24 10 L28 28 Z" fill="#3a4a32"/><rect x="10" y="14" width="4" height="5" fill="#1a1f16"/><rect x="18" y="14" width="4" height="5" fill="#1a1f16"/><path d="M12 24 L20 24" stroke="#5d705a" stroke-width="2"/></svg>`,
  virus: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="8" fill="#6ecf2f"/><circle cx="16" cy="16" r="4" fill="#161c15"/><circle cx="8" cy="10" r="2" fill="#6ecf2f"/><circle cx="24" cy="10" r="2" fill="#6ecf2f"/><circle cx="8" cy="22" r="2" fill="#6ecf2f"/><circle cx="24" cy="22" r="2" fill="#6ecf2f"/></svg>`,
  apocalypse: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" fill="#9e1b1b"/><path d="M10 10 L22 22 M22 10 L10 22" stroke="#ffbf00" stroke-width="3"/><circle cx="16" cy="16" r="3" fill="#ffbf00"/></svg>`,
  god: `<svg viewBox="0 0 32 32"><ellipse cx="16" cy="15" rx="10" ry="11" fill="#ffbf00"/><path d="M6 8 L10 4 L14 8 L18 4 L22 8 L26 4" fill="none" stroke="#ffbf00" stroke-width="2"/><circle cx="12" cy="14" r="2" fill="#9e1b1b"/><circle cx="20" cy="14" r="2" fill="#9e1b1b"/><path d="M11 24 Q16 28 21 24" fill="#9e1b1b"/></svg>`,
  goldenBrain: `<svg viewBox="0 0 64 64"><defs><radialGradient id="gbglow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ffbf00" stop-opacity="0.6"/><stop offset="100%" stop-color="#ffbf00" stop-opacity="0"/></radialGradient></defs><circle cx="32" cy="32" r="30" fill="url(#gbglow)"/><path d="M20 20 Q32 10 44 20 Q54 32 44 44 Q32 54 20 44 Q10 32 20 20" fill="#ffbf00" stroke="#d4a017" stroke-width="2"/><path d="M26 26 Q32 22 38 26" fill="none" stroke="#d4a017" stroke-width="2"/></svg>`,
  hordeBoss: `<svg viewBox="0 0 100 100"><defs><radialGradient id="bossglow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#e62e2e" stop-opacity="0.5"/><stop offset="100%" stop-color="#e62e2e" stop-opacity="0"/></radialGradient></defs><circle cx="50" cy="50" r="45" fill="url(#bossglow)"/><path d="M25 25 L35 45 L20 40 L40 55 L15 60 L45 70 L25 85 L55 75 L60 95 L70 70 L90 80 L80 55 L100 50 L80 45 L90 20 L70 30 L60 5 L55 25 L25 25" fill="#4a0f0f"/><circle cx="40" cy="45" r="5" fill="#ffbf00"/><circle cx="60" cy="45" r="5" fill="#ffbf00"/><path d="M35 70 Q50 60 65 70" fill="#2a2018"/></svg>`
};
```

---

## Task 1: Variables CSS base y texturas globales

**Files:**
- Modify: `style.css:1-38` (variables `:root`)

**Interfaces:**
- Consumes: Ninguna.
- Produces: Nuevas variables CSS globales usadas por todos los componentes.

- [ ] **Step 1: Reemplazar variables `:root` existentes por la paleta Necrópolis Premium**

```css
:root {
  --bg-void: #030503;
  --bg-900: #070a07;
  --bg-800: #0d120d;
  --bg-700: #161c15;
  --bg-600: #212821;
  --bg-500: #2e382c;

  --green-500: #6ecf2f;
  --green-400: #9aff4d;
  --green-300: #c8ff99;
  --green-glow: rgba(110, 207, 47, 0.4);
  --green-glow-soft: rgba(110, 207, 47, 0.15);

  --red-500: #9e1b1b;
  --red-400: #e62e2e;
  --red-glow: rgba(230, 46, 46, 0.35);

  --gold-400: #d4a017;
  --gold-500: #ffbf00;
  --gold-glow: rgba(255, 191, 0, 0.35);

  --text-primary: #f0f7ec;
  --text-secondary: #8fa085;
  --text-muted: #55664f;
  --border: rgba(110, 207, 47, 0.12);
  --border-strong: rgba(110, 207, 47, 0.25);

  --font-display: 'Creepster', 'Impact', fantasy, sans-serif;
  --font-body: 'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'Share Tech Mono', 'Consolas', monospace;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.35);
  --shadow-md: 0 8px 28px rgba(0, 0, 0, 0.45);
  --shadow-lg: 0 18px 48px rgba(0, 0, 0, 0.55);
  --glow-green: 0 0 24px var(--green-glow);
  --glow-red: 0 0 24px var(--red-glow);
}
```

- [ ] **Step 2: Añadir textura de ruido y niebla como CSS data URI**

Añadir al final de `style.css` (o en una sección nueva de utilidades):

```css
/* Textura de ruido de película */
body::after {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.035;
  z-index: 9999;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* Niebla radial animada */
@keyframes fogDrift {
  0% { transform: scale(1) translate(0, 0); opacity: 0.4; }
  50% { transform: scale(1.08) translate(-2%, 1%); opacity: 0.55; }
  100% { transform: scale(1) translate(0, 0); opacity: 0.4; }
}
```

- [ ] **Step 3: Actualizar `body` para usar el fondo más oscuro**

```css
body {
  font-family: var(--font-body);
  background:
    radial-gradient(1200px 600px at 20% -10%, rgba(110, 207, 47, 0.07) 0%, transparent 60%),
    linear-gradient(180deg, var(--bg-void) 0%, var(--bg-900) 100%);
  color: var(--text-primary);
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 4: Verificar visualmente y correr tests**

Run: `node tests/logic.test.js`
Expected: `Todos los tests pasaron correctamente.`

Visual: Abrir `index.html` en navegador. El fondo debe verse más oscuro y profundo.

- [ ] **Step 5: Commit**

```bash
git add style.css
git commit -m "feat(ui): base Necropolis color palette and textures"
```

---

## Task 2: Tipografía y topbar premium

**Files:**
- Modify: `style.css` (topbar, tipografía)
- Modify: `index.html:14-41` (estructura del topbar)

**Interfaces:**
- Consumes: Variables CSS de Task 1.
- Produces: Topbar rediseñado con iconos SVG.

- [ ] **Step 1: Añadir utilidades tipográficas en `style.css`**

```css
/* Tipografía */
.tabular-nums { font-variant-numeric: tabular-nums; }

.tracking-wide { letter-spacing: 0.05em; }
.tracking-wider { letter-spacing: 0.1em; }
```

- [ ] **Step 2: Rediseñar `#topbar` en `style.css`**

Reemplazar la sección `/* Header */` por:

```css
/* Header */
#topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 18px;
  min-height: 60px;
  background: rgba(7, 10, 7, 0.92);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 20;
  flex-wrap: nowrap;
}

#brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

#brand-icon {
  width: 34px;
  height: 34px;
  color: var(--green-400);
  filter: drop-shadow(0 0 8px var(--green-glow));
}

#brand-text { display: flex; flex-direction: column; }
#brand-name {
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--green-400);
  line-height: 1;
  letter-spacing: 1px;
}
#brand-sub {
  display: none;
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

#topbar-stats {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
  flex-wrap: nowrap;
}
.topbar-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.topbar-stat-label {
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1.5px;
}
.topbar-stat-value {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 700;
  color: var(--green-300);
  font-variant-numeric: tabular-nums;
}

.topbar-stat--brains {
  position: relative;
  padding-bottom: 5px;
}
.topbar-stat--brains::after {
  content: "";
  position: absolute;
  left: 10%;
  right: 10%;
  bottom: 0;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, transparent, var(--green-500), transparent);
}
.topbar-stat--brains .topbar-stat-label {
  color: var(--text-secondary);
  font-size: 10px;
}
.topbar-stat--brains .topbar-stat-value {
  font-size: clamp(24px, 2.6vw, 34px);
  letter-spacing: -0.02em;
  line-height: 1.05;
}
.topbar-stat--bps .topbar-stat-value {
  font-size: 18px;
  color: var(--text-secondary);
}
.topbar-stat--souls .topbar-stat-value {
  color: var(--gold-400);
  font-size: 17px;
}

#topbar-actions {
  display: flex;
  gap: 8px;
}
.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--bg-700);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, color 0.15s ease, transform 0.08s ease, box-shadow 0.15s ease;
}
.icon-btn svg {
  width: 18px;
  height: 18px;
}
.icon-btn:hover {
  background: var(--bg-600);
  color: var(--text-primary);
  box-shadow: var(--glow-green);
}
.icon-btn:active { transform: scale(0.94); }
```

- [ ] **Step 3: Reemplazar el logo emoji y botones emojis en `index.html`**

En `#brand-icon`, reemplazar `🧟` por el SVG del logo (miniatura del zombie):

```html
<div id="brand-icon">
  <svg viewBox="0 0 32 32" aria-hidden="true"><ellipse cx="16" cy="16" rx="12" ry="13" fill="#6e7f62"/><circle cx="12" cy="14" r="2.5" fill="#9aff4d"/><circle cx="20" cy="14" r="2.5" fill="#9aff4d"/><path d="M12 22 Q16 25 20 22" fill="#2a2018"/></svg>
</div>
```

En `#topbar-actions`, reemplazar los emojis por SVGs usando los iconos definidos en la sección de SVG Assets. Por ejemplo:

```html
<div id="topbar-actions">
  <button id="btn-save" class="icon-btn" title="Guardar"><svg ...save-icon...></svg></button>
  <button id="btn-reset" class="icon-btn" title="Reiniciar"><svg ...reset-icon...></svg></button>
  <button id="btn-help" class="icon-btn" title="Cómo jugar"><svg ...help-icon...></svg></button>
</div>
```

- [ ] **Step 4: Verificar y correr tests**

Run: `node tests/logic.test.js`
Expected: `Todos los tests pasaron correctamente.`

Visual: Topbar con logo SVG, stats centrados, iconos SVG en acciones.

- [ ] **Step 5: Commit**

```bash
git add style.css index.html
git commit -m "feat(ui): premium topbar with SVG icons"
```

---

## Task 3: Clicker stage inmersivo con zombie SVG

**Files:**
- Modify: `index.html:43-68` (zombie SVG, estructura stage)
- Modify: `style.css` (#clicker-card, #zombie-btn, animaciones zombie)
- Modify: `ui.js:94-106` (pulseZombie para usar clases del SVG)

**Interfaces:**
- Consumes: Variables CSS, iconos SVG.
- Produces: Stage del clicker rediseñado con zombie SVG animado.

- [ ] **Step 1: Reemplazar el emoji zombie en `index.html` por SVG inline**

```html
<button id="zombie-btn" aria-label="Ganar cerebro">
  <span id="zombie-icon">
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="zombie-svg" aria-hidden="true">
      <defs>
        <radialGradient id="zglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#9aff4d" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#9aff4d" stop-opacity="0"/>
        </radialGradient>
        <filter id="zshadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.6"/>
        </filter>
      </defs>
      <circle cx="100" cy="105" r="78" fill="url(#zglow)"/>
      <g filter="url(#zshadow)">
        <ellipse cx="100" cy="100" rx="70" ry="75" fill="#5a6b4f"/>
        <ellipse cx="100" cy="95" rx="60" ry="55" fill="#6e7f62"/>
        <path d="M55 75 Q70 60 85 75" fill="none" stroke="#3a4a32" stroke-width="4" stroke-linecap="round"/>
        <path d="M115 75 Q130 60 145 75" fill="none" stroke="#3a4a32" stroke-width="4" stroke-linecap="round"/>
        <circle cx="72" cy="92" r="14" fill="#1a1f16"/>
        <circle cx="128" cy="92" r="14" fill="#1a1f16"/>
        <circle cx="75" cy="90" r="5" fill="#9aff4d" class="zombie-eye-glow"/>
        <circle cx="131" cy="90" r="5" fill="#9aff4d" class="zombie-eye-glow"/>
        <path d="M75 130 Q100 155 125 130" fill="#2a2018"/>
        <path d="M80 132 L85 142 L90 132 L95 142 L100 132 L105 142 L110 132 L115 142 L120 132" fill="#eef2ea"/>
        <path d="M40 100 L55 95 L40 110" fill="#4a5a40"/>
        <path d="M160 100 L145 95 L160 110" fill="#4a5a40"/>
        <path d="M50 140 Q45 160 60 165" fill="none" stroke="#3a4a32" stroke-width="3" stroke-linecap="round"/>
        <path d="M150 140 Q155 160 140 165" fill="none" stroke="#3a4a32" stroke-width="3" stroke-linecap="round"/>
      </g>
    </svg>
  </span>
</button>
```

- [ ] **Step 2: Rediseñar `#clicker-card` y `#zombie-btn` en `style.css`**

```css
#clicker-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 45%, rgba(110, 207, 47, 0.08) 0%, transparent 55%),
    radial-gradient(ellipse at 50% 85%, rgba(0, 0, 0, 0.45) 0%, transparent 60%),
    var(--bg-800);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

#clicker-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.04;
  pointer-events: none;
  animation: fogDrift 20s ease-in-out infinite;
}

#zombie-btn {
  width: 240px;
  height: 240px;
  border-radius: 50%;
  border: none;
  background:
    radial-gradient(circle at 30% 30%, var(--bg-600) 0%, var(--bg-800) 55%, var(--bg-900) 100%);
  box-shadow:
    0 0 0 8px rgba(110, 207, 47, 0.08),
    inset 0 0 60px rgba(0, 0, 0, 0.6),
    0 0 40px rgba(110, 207, 47, 0.12);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  position: relative;
}
#zombie-btn:hover {
  box-shadow:
    0 0 0 10px rgba(110, 207, 47, 0.12),
    inset 0 0 60px rgba(0, 0, 0, 0.5),
    0 0 60px var(--green-glow);
}
#zombie-btn:active { transform: scale(0.92); }
#zombie-btn.popping { animation: zombiePop 0.18s ease; }

#zombie-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  filter: drop-shadow(0 0 12px rgba(110, 207, 47, 0.25));
  transition: transform 0.1s ease;
}
#zombie-icon svg {
  width: 90%;
  height: 90%;
}
#zombie-btn:hover #zombie-icon { transform: scale(1.05); }

.zombie-eye-glow {
  animation: eyeGlow 3s ease-in-out infinite;
}
@keyframes eyeGlow {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
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

@keyframes zombiePop {
  0% { transform: scale(0.92); }
  50% { transform: scale(1.06); }
  100% { transform: scale(1); }
}

@keyframes zombieBreathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.025); }
}
```

- [ ] **Step 3: Ajustar `pulseZombie` en `ui.js`**

Actualmente cambia `icon.textContent` a 💀. Como ahora es SVG, reemplazar por una clase que cambie la expresión o simplemente dejar el pop animation. Cambiar:

```js
function pulseZombie() {
  const btn = $("zombie-btn");
  if (!btn) return;
  btn.classList.remove("popping");
  void btn.offsetWidth;
  btn.classList.add("popping");
}
```

- [ ] **Step 4: Asegurar que cosméticos actuales funcionen**

Actualizar reglas de cosméticos en `style.css` para aplicarse al nuevo SVG. Por ejemplo:

```css
/* Cosméticos: skins */
#clicker-card[data-skin="skin-rot"] #zombie-icon svg ellipse[fill="#6e7f62"] {
  fill: #6b7a55;
}
#clicker-card[data-skin="skin-rot"] #zombie-icon svg ellipse[fill="#5a6b4f"] {
  fill: #4f5d45;
}
#clicker-card[data-skin="skin-neon"] #zombie-icon svg {
  filter: drop-shadow(0 0 12px var(--green-400)) drop-shadow(0 0 24px var(--green-glow)) saturate(1.6) brightness(1.1);
}
#clicker-card[data-skin="skin-king"] #zombie-icon svg {
  filter: sepia(0.6) saturate(2) hue-rotate(-20deg) drop-shadow(0 0 10px var(--gold-400));
}
```

- [ ] **Step 5: Verificar y correr tests**

Run: `node tests/logic.test.js`
Expected: `Todos los tests pasaron correctamente.`

Visual: Stage con zombie SVG, animaciones idle, click funciona, cosméticos se aplican.

- [ ] **Step 6: Commit**

```bash
git add style.css index.html ui.js
git commit -m "feat(ui): immersive clicker stage with custom zombie SVG"
```

---

## Task 4: Tarjetas de tienda premium

**Files:**
- Modify: `style.css` (.item-card, .shop-tab, .buy-qty, etc.)
- Modify: `ui.js:298-451` (buildGeneratorCard, buildUpgradeCard, buildCosmeticCard)

**Interfaces:**
- Consumes: Variables CSS, SVG icons.
- Produces: Tarjetas de tienda renderizadas con SVGs y estados premium.

- [ ] **Step 1: Actualizar estilos de tarjetas en `style.css`**

```css
/* Item card premium */
.item-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(145deg, var(--bg-700), rgba(22, 28, 21, 0.6));
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.08s ease, box-shadow 0.15s ease;
  position: relative;
  overflow: hidden;
}
.item-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(110, 207, 47, 0.15), transparent 40%, transparent 60%, rgba(110, 207, 47, 0.05));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
@media (hover: hover) and (pointer: fine) {
  .item-card:hover {
    background: var(--bg-600);
    border-color: var(--green-500);
    box-shadow: 0 0 16px var(--green-glow-soft);
  }
}
.item-card:active { transform: translateY(1px); }
.item-card.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.item-card.affordable {
  border-color: var(--green-500);
  box-shadow: 0 0 14px var(--green-glow);
}
.item-card.owned {
  border-color: var(--green-500);
  background: rgba(110, 207, 47, 0.08);
}

.item-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-800);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}
.item-icon svg {
  width: 26px;
  height: 26px;
}
```

- [ ] **Step 2: Actualizar tabs de tienda y barra de cantidad**

```css
/* Shop tabs premium */
#shop-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
  background: var(--bg-900);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 4px;
}
.shop-tab {
  flex: 1;
  padding: 10px 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-xl);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.shop-tab:hover { color: var(--text-primary); }
.shop-tab.active {
  background: rgba(110, 207, 47, 0.12);
  color: var(--green-300);
  border-color: var(--green-500);
  box-shadow: 0 0 12px var(--green-glow-soft);
}

/* Buy quantity chips */
.buy-qty {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}
.qty-btn {
  padding: 5px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-800);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}
.qty-btn:hover { border-color: var(--border-strong); color: var(--text-primary); }
.qty-btn.active {
  background: var(--green-500);
  color: var(--bg-900);
  border-color: var(--green-500);
  box-shadow: 0 0 10px var(--green-glow-soft);
}
```

- [ ] **Step 3: Actualizar `buildGeneratorCard` en `ui.js` para usar SVGs**

Mantener el mapa de iconos. Ejemplo:

```js
const GEN_ICONS = {
  superviviente: ICONS.survivor,
  mordedor: ICONS.biter,
  corredor: ICONS.runner,
  rabioso: ICONS.rabid,
  jefe: ICONS.boss,
  horde: ICONS.horde,
  necro: ICONS.necro,
  "virus-alfa": ICONS.virus,
  apocalipsis: ICONS.apocalypse,
  "zombie-dios": ICONS.god
};

function buildGeneratorCard(gen) {
  const div = document.createElement("div");
  div.setAttribute("data-gen-id", gen.id);
  div.innerHTML =
    '<span class="item-icon">' + (GEN_ICONS[gen.id] || gen.icon) + '</span>' +
    '<div class="item-info">' +
      '<div class="item-name">' + gen.name + '</div>' +
      '<div class="item-desc">' + gen.desc + '</div>' +
    '</div>' +
    '<div class="item-meta">' +
      '<span class="item-cost">0</span>' +
      '<span class="item-count"></span>' +
    '</div>';
  div.addEventListener("click", function () { buyGenerator(gen.id); });
  return div;
}
```

- [ ] **Step 4: Actualizar `buildUpgradeCard` y `buildCosmeticCard`**

Para mejoras, mantener el icono SVG según tipo. Para cosméticos, usar un icono genérico de paleta para todos o mantener el emoji como fallback.

```js
function buildUpgradeCard(upg) {
  const div = document.createElement("div");
  div.setAttribute("data-upg-id", upg.id);
  div.innerHTML =
    '<span class="item-icon">' + (UPGRADE_ICONS[upg.id] || upg.icon) + '</span>' +
    '<div class="item-info">' +
      '<div class="item-name">' + upg.name + '</div>' +
      '<div class="item-desc">' + upg.desc + '</div>' +
    '</div>' +
    '<span class="item-cost">' + formatNumber(upg.cost) + '</span>';
  div.addEventListener("click", function () { buyUpgrade(upg.id); });
  return div;
}
```

Donde `UPGRADE_ICONS` mapea IDs a SVGs simples (mano, diente, garra, puño, rayo, hueso, tubo, fuego, corona, músculo).

- [ ] **Step 5: Verificar y correr tests**

Run: `node tests/logic.test.js`
Expected: `Todos los tests pasaron correctamente.`

Visual: Tienda con tarjetas premium, iconos SVG, tabs segmentados, chips de cantidad.

- [ ] **Step 6: Commit**

```bash
git add style.css ui.js
git commit -m "feat(ui): premium shop cards with SVG icons"
```

---

## Task 5: Panel lateral, logros, prestigio y stats

**Files:**
- Modify: `style.css` (#side-tabs, .side-tab, .prestige-help, .btn-prestige, .stats-grid)
- Modify: `index.html:91-140` (iconos de side-tabs)
- Modify: `ui.js:453-528` (renderAchievements, renderPrestige, renderStats)

**Interfaces:**
- Consumes: Variables CSS, SVG icons.
- Produces: Paneles laterales rediseñados.

- [ ] **Step 1: Rediseñar side tabs y panels en `style.css`**

```css
#side-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
  background: var(--bg-900);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 4px;
}
.side-tab {
  flex: 1;
  padding: 10px 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-xl);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.side-tab svg { width: 16px; height: 16px; }
.side-tab:hover { color: var(--text-primary); }
.side-tab.active {
  background: rgba(110, 207, 47, 0.12);
  color: var(--green-300);
  border-color: var(--green-500);
  box-shadow: 0 0 12px var(--green-glow-soft);
}
```

- [ ] **Step 2: Rediseñar prestigio**

```css
.prestige-help {
  margin: 0 0 16px;
  padding: 14px;
  background: linear-gradient(145deg, rgba(255, 191, 0, 0.06), rgba(158, 27, 27, 0.05));
  border: 1px solid rgba(255, 191, 0, 0.2);
  border-radius: var(--radius-md);
  font-size: 13px;
  line-height: 1.55;
  color: var(--text-secondary);
}
.btn-prestige {
  width: 100%;
  background: linear-gradient(135deg, var(--red-400), var(--red-500));
  color: #fff;
  border: none;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  transition: all 0.15s ease;
}
.btn-prestige:hover { box-shadow: var(--glow-red); }
.btn-prestige:disabled {
  background: var(--bg-600);
  color: var(--text-muted);
  box-shadow: none;
}
```

- [ ] **Step 3: Actualizar iconos de side-tabs en `index.html`**

Reemplazar emojis 🏆, ✨, 📊 por SVGs de ICONS.achievements, ICONS.prestige, ICONS.stats.

- [ ] **Step 4: Actualizar `renderAchievements` en `ui.js`**

Reemplazar iconos de candado ✅/🔒 por SVGs:

```js
const lockIcon = ICONS.lock;
const checkIcon = ICONS.check;

function renderAchievements(newlyUnlocked) {
  const container = $("achievements-list");
  if (!container || !state) return;
  const shineIds = newlyUnlocked || [];
  container.innerHTML = "";
  Game.ACHIEVEMENTS.forEach(function (ach) {
    const unlocked = state.achievements.indexOf(ach.id) !== -1;
    const div = document.createElement("div");
    div.className = "item-card ach-card" + (unlocked ? " unlocked" : " locked");
    div.setAttribute("data-ach-id", ach.id);
    div.innerHTML =
      '<span class="item-icon">' + (unlocked ? checkIcon : lockIcon) + '</span>' +
      '<div class="item-info">' +
        '<div class="item-name">' + ach.name + '</div>' +
        '<div class="item-desc">' + ach.desc + '</div>' +
      '</div>' +
      '<span class="ach-bonus">+' + (ach.bonus * 100).toFixed(0) + '%</span>';
    container.appendChild(div);
    if (shineIds.indexOf(ach.id) !== -1) {
      setTimeout(function () { div.classList.add("shine"); }, 10);
    }
  });
}
```

- [ ] **Step 5: Verificar y correr tests**

Run: `node tests/logic.test.js`
Expected: `Todos los tests pasaron correctamente.`

Visual: Side tabs con iconos SVG, prestigio con gradiente sangre, logros con candado/check SVG.

- [ ] **Step 6: Commit**

```bash
git add style.css index.html ui.js
git commit -m "feat(ui): premium side panels with SVG icons"
```

---

## Task 6: Eventos y toasts premium

**Files:**
- Modify: `style.css` (.event-item, #golden-brain, #horde-boss, .toast)
- Modify: `index.html:152-153` (eventos)
- Modify: `ui.js:612-688` (spawnGoldenBrain, spawnBoss)

**Interfaces:**
- Consumes: Variables CSS, SVG icons.
- Produces: Eventos y toasts con estética premium.

- [ ] **Step 1: Reemplazar eventos por SVGs en `index.html`**

```html
<div id="golden-brain" class="event-item hidden">${ICONS.goldenBrain}</div>
<div id="horde-boss" class="event-item hidden">${ICONS.hordeBoss}</div>
```

Nota: como los eventos se generan estáticamente, el SVG puede ir directamente en el HTML o inyectarse por JS. Para mantener simple, poner el SVG inline en `index.html`.

- [ ] **Step 2: Actualizar estilos de eventos en `style.css`**

```css
.event-item {
  position: fixed;
  cursor: pointer;
  user-select: none;
  z-index: 90;
  display: none;
  pointer-events: auto;
}
.event-item.visible { display: block; }

#golden-brain {
  width: 72px;
  height: 72px;
  animation: goldenFloat 8s ease-in-out forwards, goldenPulse 1.2s ease-in-out infinite;
}
#golden-brain svg { width: 100%; height: 100%; }
#golden-brain.popping {
  animation: goldenPop 0.35s ease forwards;
}

#horde-boss {
  top: 80px;
  left: 50%;
  width: 100px;
  height: 100px;
  transform: translateX(-50%);
  animation: bossEntrance 0.5s ease, bossHover 2s ease-in-out infinite;
}
#horde-boss svg { width: 100%; height: 100%; }
```

- [ ] **Step 3: Mejorar estilos de toasts**

```css
.toast {
  background: linear-gradient(145deg, var(--bg-800), var(--bg-700));
  border: 1px solid var(--border);
  border-left: 4px solid var(--green-500);
  color: var(--text-primary);
  padding: 12px 14px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  animation: slideIn 0.25s ease;
  font-size: 14px;
  position: relative;
  overflow: hidden;
}
.toast.success { border-left-color: var(--green-500); box-shadow: 0 0 16px var(--green-glow-soft); }
.toast.warn { border-left-color: var(--gold-500); box-shadow: 0 0 16px var(--gold-glow); }
.toast.info { border-left-color: var(--text-secondary); }
```

- [ ] **Step 4: Verificar y correr tests**

Run: `node tests/logic.test.js`
Expected: `Todos los tests pasaron correctamente.`

Visual: Toasts con bordes y glows, eventos como SVGs animados.

- [ ] **Step 5: Commit**

```bash
git add style.css index.html ui.js
git commit -m "feat(ui): premium toasts and event SVGs"
```

---

## Task 7: Mobile responsive

**Files:**
- Modify: `style.css` (media queries mobile)
- Modify: `index.html:144-149` (mobile nav iconos)
- Modify: `ui.js:586-610` (setupMobileNav)

**Interfaces:**
- Consumes: Layout y componentes de tareas anteriores.
- Produces: Versión mobile pulida con iconos SVG.

- [ ] **Step 1: Actualizar mobile nav en `index.html`**

Reemplazar emojis por SVGs pequeños de ICONS (achievements, prestige, stats) y un icono de zombie para Juego.

```html
<nav id="mobile-nav">
  <button class="mobile-tab active" data-mobile="game"><svg>...</svg> Juego</button>
  ...
</nav>
```

- [ ] **Step 2: Mejorar estilos mobile nav en `style.css`**

```css
#mobile-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: rgba(3, 5, 3, 0.95);
  border-top: 1px solid var(--border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 30;
  padding-bottom: env(safe-area-inset-bottom);
}
.mobile-tab {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: color 0.15s ease;
  padding: 6px 0;
}
.mobile-tab svg { width: 22px; height: 22px; }
.mobile-tab.active { color: var(--green-400); }
.mobile-tab.active svg { filter: drop-shadow(0 0 6px var(--green-glow)); }
```

- [ ] **Step 3: Ajustar media queries existentes para mobile**

Asegurar que en pantallas < 768px se muestre `#mobile-nav` y se oculten columnas no activas. Mantener el layout actual de mobile pero asegurar que el stage ocupe altura disponible.

```css
@media (max-width: 767px) {
  .main-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  #mobile-nav { display: flex; }
  #main { padding-bottom: 80px; }
  .col:not(.active) { display: none; }
  .col.active { display: flex; }
  #clicker-card { min-height: calc(100vh - 160px); }
  #zombie-btn { width: 220px; height: 220px; }
}
```

- [ ] **Step 4: Verificar y correr tests**

Run: `node tests/logic.test.js`
Expected: `Todos los tests pasaron correctamente.`

Visual: DevTools mobile, navegación inferior con iconos SVG, stage legible.

- [ ] **Step 5: Commit**

```bash
git add style.css index.html ui.js
git commit -m "feat(ui): polish mobile responsive layout"
```

---

## Task 8: Accesibilidad y animaciones seguras

**Files:**
- Modify: `style.css` (media query prefers-reduced-motion)

**Interfaces:**
- Consumes: Animaciones definidas en tareas anteriores.
- Produces: Animaciones reducidas para usuarios con motion sensitivity.

- [ ] **Step 1: Añadir bloque global de reduced motion**

Al final de `style.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  body::after { animation: none; }
}
```

- [ ] **Step 2: Verificar contraste y aria-labels**

Revisar que:
- Todos los botones con iconos SVG mantengan `aria-label` o texto visible.
- `text-secondary` (#8fa085) sobre `bg-800` (#0d120d) tenga contraste >= 4.5:1.
- `text-muted` (#55664f) solo se use para labels secundarios pequeños.

- [ ] **Step 3: Verificar y correr tests**

Run: `node tests/logic.test.js`
Expected: `Todos los tests pasaron correctamente.`

- [ ] **Step 4: Commit**

```bash
git add style.css
git commit -m "feat(ui): respect reduced motion and accessibility checks"
```

---

## Task 9: Verificación final

**Files:**
- Review: `style.css`, `index.html`, `ui.js`

**Interfaces:**
- Consumes: Todo el trabajo anterior.
- Produces: Juego rediseñado verificado.

- [ ] **Step 1: Correr tests de lógica**

Run: `node tests/logic.test.js`
Expected: `Todos los tests pasaron correctamente.`

- [ ] **Step 2: Verificar flujo manual en navegador**

1. Abrir `index.html`.
2. Hacer click en zombie: debe animarse y sumar cerebros.
3. Comprar un generador: tarjeta debe hacer flash y restar cerebros.
4. Cambiar tabs de tienda: funcionan.
5. Desbloquear un logro: aparece toast y shine.
6. Ver pestaña Prestigio: botón deshabilitado si no hay almas para ganar.
7. Probar mobile en DevTools: navegación inferior funciona.
8. Recargar página: progreso guardado en localStorage persiste.

- [ ] **Step 3: Verificar cosméticos**

Comprar y equipar skins/auras/fondos. Verificar que:
- `skin-neon` aplica glow verde al zombie SVG.
- `aura-blood` aplica glow rojo al botón.
- `bg-necro` cambia el fondo del stage.

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "feat(ui): complete Necropolis Premium visual revamp"
```

---

## Self-Review Checklist

- [ ] **Spec coverage:** Todas las secciones del spec (paleta, tipografía, layout, componentes, SVGs, animaciones, mobile, accesibilidad) tienen tareas correspondientes.
- [ ] **No placeholders:** No hay TBD, TODO ni referencias vagas.
- [ ] **Type consistency:** Los nombres de clases, IDs y funciones coinciden con el código existente.
- [ ] **Testability:** Cada tarea termina con `node tests/logic.test.js`.
- [ ] **Constraints:** No se modifica `game.js`, no se añaden dependencias.
