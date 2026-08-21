# Zombie Clicker — UX AFK: Topbar, Hover fix, Cosméticos, Tutorial

> **For agentic workers:** Implement **one Task at a time**. Do not ask clarifying questions — all product decisions are locked below. If blocked by a missing file/ID, fail the task with a short summary; do not invent new systems outside this plan. Use checkbox (`- [ ]`) tracking. After each task: `node tests/logic.test.js` must pass.

**Goal:** Hacer que el progreso (números) sea el héroe visual en desktop, eliminar el “hover/click stuck” del shop, agregar cosméticos comprables con cerebros, y enseñar qué son las Almas con un tutorial in-game.

**Architecture:** Mantener stack vanilla. El bug de hover/qty viene de `gameLoop` → `renderShop()` cada 100ms que hace `innerHTML = ""` y recrea nodos bajo el cursor. Cosméticos viven en `game.js` (catálogo + compra + estado) y se aplican en `ui.js`/`style.css`. Tutorial es overlay UI-only con flag en save.

**Tech Stack:** HTML5, CSS3, JavaScript ES5/IIFE, localStorage. Sin frameworks, sin build, sin sonidos, sin backend.

---

## Locked Decisions (NO preguntar)

1. **Causa raíz hover/qty:** recreación total del DOM del shop en cada tick. Fix = update-in-place (nunca destruir nodos en el loop).
2. **Topbar desktop:** los números son el héroe. Brand se reduce; Cerebros es el número más grande; BPS secundario; Almas terciario con tip explicativo.
3. **Animaciones de números:** solo CSS/`classList` pop cuando el valor formateado **cambia**; no librerías; no animar cada frame.
4. **Cosméticos:** se compran con **cerebros**, son **vanity** (no cambian BPS/click), **persisten en prestige** (como logros). Equipar 1 skin + 1 aura + 1 fondo.
5. **Catálogo cosméticos (fijo):** ver tabla en Task 4. No agregar ítems extra.
6. **Tutorial:** 5 pasos fijos en español; se muestra en primer load (`meta.tutorialDone !== true`); botón `?` en topbar lo reabre; no bloquear el juego más de un paso a la vez.
7. **Almas (copy canónico):** “Las Almas son la moneda de Prestigio. Al Ascender reiniciás cerebros/generadores/mejoras y ganás Almas permanentes. Cada Alma da +5% multiplicador global. También se gastan en la Tienda de Almas.”
8. **Idioma UI:** español.
9. **No tocar balance** de generadores/mejoras/prestige upgrades existentes (costos/efectos). Cosméticos son nuevos sinks de cerebros.
10. **Mobile:** topbar compacta OK; cosméticos y tutorial deben funcionar; no rediseñar mobile nav.

## Global Constraints

- Stack vanilla HTML/CSS/JS; sin npm deps para el juego.
- `node tests/logic.test.js` pasa después de cada Task que toque `game.js` o save.
- `game.js` = lógica pura testable; `ui.js` = DOM; `style.css` = look; `index.html` = estructura.
- No commits salvo que el runner pase `--commit`.
- No reescribir el rediseño v3 entero; solo los cambios de este plan.
- Preferir `textContent` updates y `classList` sobre `innerHTML` wipe.

## File Structure


| File | Responsibility |
|------|----------------|
| `index.html` | Topbar hero, tab Cosméticos, overlay tutorial, botón ayuda |
| `style.css` | Topbar numbers, cosmetics themes, tutorial overlay, hover-safe shop |
| `game.js` | COSMETICS catalog, buy/equip, state+deserialize, tutorial meta |
| `ui.js` | Patch-render shop, header pop, cosmetics UI, tutorial flow |
| `tests/logic.test.js` | Tests buy/equip cosmetics + prestige persistence |
| `COMO-JUGAR.md` | Sección Almas/tutorial alineada al copy canónico |


---

### Task 1: Fix crítico — Shop update-in-place (hover + x1/x10)

**Files:**

- Modify: `ui.js` (`renderGenerators`, `renderUpgrades`, `gameLoop`)
- Modify: `style.css` (opcional: `@media (hover: hover)` en `.item-card:hover` / `.qty-btn`)
- Test: `node tests/logic.test.js` + verificación manual descrita abajo

**Root cause (locked):** `gameLoop` llama `renderShop()` ~10×/s. `renderGenerators` hace `container.innerHTML = ""`, recrea `.buy-qty` y `.item-card`. Eso:
- reinicia `:hover` en loop visual;
- hace que clicks en `x1/x10/Max` fallen o “se traben” porque el nodo desaparece bajo el pointer.

**Interfaces:**

- Consumes: `#shop-list-generators`, `#shop-list-upgrades`, `generatorQty`
- Produces: DOM estable; solo muta texto/clases/costos

- [ ] **Step 1: Sacar la barra qty del wipe**

En `index.html` (o crearla una sola vez en JS si aún no existe en HTML), la barra `#buy-qty-bar` debe vivir **fuera** de `#shop-list-generators` o crearse solo si `!$("buy-qty-bar")`.

Preferido — en `index.html` dentro de `#shop-card`, **antes** de `#shop-content`:

```html
<div id="buy-qty-bar" class="buy-qty" aria-label="Cantidad de compra">
  <button type="button" class="qty-btn active" data-qty="1">x1</button>
  <button type="button" class="qty-btn" data-qty="10">x10</button>
  <button type="button" class="qty-btn" data-qty="0">Max</button>
</div>
```

- [ ] **Step 2: Wire qty una sola vez en `init`**

Añadir `setupBuyQty()`:

```js
function setupBuyQty() {
  const bar = $("buy-qty-bar");
  if (!bar || bar.getAttribute("data-wired") === "1") return;
  bar.setAttribute("data-wired", "1");
  bar.addEventListener("click", function (e) {
    const btn = e.target.closest(".qty-btn");
    if (!btn) return;
    const q = Number(btn.getAttribute("data-qty"));
    if (q !== 0 && q !== 1 && q !== 10) return;
    generatorQty = q;
    Array.prototype.forEach.call(bar.querySelectorAll(".qty-btn"), function (b) {
      b.classList.toggle("active", Number(b.getAttribute("data-qty")) === generatorQty);
    });
    patchGenerators(); // update costs for new qty — no full wipe
  });
}
```

Llamar `setupBuyQty()` desde `init()`.

- [ ] **Step 3: Reemplazar `renderGenerators` por patch**

Reglas:
1. Si el container no tiene cards con `data-gen-id`, hacer **un** build inicial (crear nodos una vez).
2. En ticks siguientes: para cada `Game.GENERATORS`, encontrar `[data-gen-id="..."]` y actualizar solo:
   - `.item-cost` text (costo según `generatorQty`: si 10, sumar costos de 10 compras simuladas **sin mutar state**, o mostrar costo unitario + label `×10` — **locked:** mostrar **costo total** de la qty seleccionada usando la misma lógica que `buyGenerators` / loop de `getGeneratorCost` sobre una copia shallow de counts, **sin** restar brains).
3. Toggle clases `affordable` / `disabled` según `state.brains >= totalCost`.
4. Actualizar `.item-count` (`xN · BPS/s`).
5. **Prohibido** `container.innerHTML = ""` en el path del game loop.
6. Listeners de click: solo en el build inicial (`buyGenerator(id)`).

Helper sugerido (en `ui.js`, no hace falta exportar):

```js
function getBulkGeneratorCost(state, id, qty) {
  // qty===0 → usar Game.getMaxAffordable; costo = suma hasta ese max
  // clonar counts localmente; NO mutar state
}
```

Si `Game` ya expone algo equivalente, reutilizarlo; si no, implementar el helper localmente en `ui.js` sin cambiar balance.

- [ ] **Step 4: Patch `renderUpgrades` igual**

Build inicial una vez; luego update cost/clases; remover card solo cuando se compra (en `buyUpgrade`), no en cada tick.

- [ ] **Step 5: gameLoop**

Cambiar `renderShop()` en el loop a `patchShop()` (alias que llama patch generators/upgrades). `renderAll()` puede seguir haciendo build/patch seguro.

- [ ] **Step 6: CSS hover safe**

```css
@media (hover: hover) and (pointer: fine) {
  .item-card:hover {
    background: var(--bg-600);
    border-color: var(--green-500);
  }
}
```

Quitar o limitar el `.item-card:hover` global para que touch no quede “stuck”.

- [ ] **Step 7: Verificar manualmente**

1. Abrir `index.html`, hover un generador 3s → el glow **no** parpadea.
2. Click rápido x1 → x10 → Max → active class cambia y **no** se traba.
3. Con cerebros suficientes, comprar x10 funciona.
4. `node tests/logic.test.js` pasa.

**Done when:** hover estable, qty clickeable, tests OK.

---

### Task 2: Topbar hero — números primero (desktop)

**Files:**

- Modify: `index.html` (`#topbar`)
- Modify: `style.css` (`#topbar*`, animaciones número)
- Modify: `ui.js` (`renderHeader`)
- Test: visual desktop ≥1100px; `node tests/logic.test.js`

**Locked layout desktop (≥900px):**

```
[ brand compacto ]     [ CEREBROS hero ]  [ BPS ]  [ ALMAS + ? ]     [ save/reset/help ]
```

- Cerebros: font-mono **≥32px**, color `--green-300`, label arriba “Cerebros”.
- BPS: **≤20px**, label “por segundo”.
- Almas: **≤18px**, color `--gold-400`, `title` = copy canónico corto.
- Brand name puede bajar a ~18px; `#brand-sub` oculto en desktop si compite.
- Topbar **sin** `flex-wrap` en desktop (evitar que los números “se pierdan” abajo); `min-height` estable.
- En `<900px` se permite wrap compacto.

**HTML target (IDs a preservar):** `stat-brains`, `stat-bps`, `stat-souls`. Añadir:

```html
<button id="btn-help" class="icon-btn" title="Cómo jugar">?</button>
```

dentro de `#topbar-actions` (el tutorial lo usa en Task 5).

- [ ] **Step 1: Restructurar markup del topbar**

```html
<header id="topbar">
  <div id="brand">...</div>
  <div id="topbar-stats" role="group" aria-label="Progreso">
    <div class="topbar-stat topbar-stat--brains">
      <span class="topbar-stat-label">Cerebros</span>
      <span id="stat-brains" class="topbar-stat-value">0</span>
    </div>
    <div class="topbar-stat topbar-stat--bps">
      <span class="topbar-stat-label">Por segundo</span>
      <span id="stat-bps" class="topbar-stat-value">0/s</span>
    </div>
    <div class="topbar-stat topbar-stat--souls" title="Almas: moneda de Prestigio. Cada Alma da +5% multiplicador permanente.">
      <span class="topbar-stat-label">Almas</span>
      <span id="stat-souls" class="topbar-stat-value">0</span>
    </div>
  </div>
  <div id="topbar-actions">...</div>
</header>
```

- [ ] **Step 2: CSS hero**

- Grid/flex: `brand | stats(1fr center) | actions`.
- `.topbar-stat--brains .topbar-stat-value { font-size: clamp(28px, 3vw, 40px); letter-spacing: -0.02em; }`
- Subtle gradient underline bajo cerebros (verde podrido, no purple).
- `.topbar-stat-value.is-bump { animation: countPop 0.25s ease; }` (reutilizar `@keyframes countPop` existente).

- [ ] **Step 3: `renderHeader` con bump solo al cambiar**

```js
function setStatText(el, text) {
  if (!el) return;
  if (el.textContent === text) return;
  el.textContent = text;
  el.classList.remove("is-bump");
  void el.offsetWidth; // restart animation
  el.classList.add("is-bump");
}
```

Aplicar a brains/bps/souls. BPS formateado: `formatNumber(bps) + "/s"`.

- [ ] **Step 4: Verificar**

Desktop: cerebros legibles sin scroll/wrap; bump al ganar cerebros; mobile no roto.

**Done when:** números son el foco visual; animación solo on-change.

---

### Task 3: Explicar Almas en Prestigio (copy UI)

**Files:**

- Modify: `index.html` (`#side-panel-prestige`)
- Modify: `style.css` (bloque `.prestige-help`)
- Modify: `ui.js` (`renderPrestige` — opcional si solo HTML)
- Modify: `COMO-JUGAR.md` (sección Prestigio = copy canónico)
- Test: visual + tests existentes

- [ ] **Step 1: Bloque de ayuda bajo el título Prestigio**

```html
<div class="prestige-help">
  <p><strong>¿Qué son las Almas?</strong></p>
  <p>Las Almas son la moneda de Prestigio. Al <strong>Ascender</strong> reiniciás cerebros, generadores y mejoras, y ganás Almas permanentes.</p>
  <ul>
    <li>Cada Alma → <strong>+5%</strong> multiplicador global</li>
    <li>Fórmula: <code>floor(sqrt(cerebrosTotales / 1e6))</code></li>
    <li>Gastá Almas en la tienda de abajo (mejoras permanentes)</li>
  </ul>
</div>
```

- [ ] **Step 2: Estilo** `.prestige-help` tipografía body legible, borde sutil gold, sin card-within-card excesivo.

- [ ] **Step 3: Actualizar `COMO-JUGAR.md`** para usar el mismo copy (sin contradicciones).

**Done when:** un jugador nuevo entiende Almas sin salir del panel Prestigio.

---

### Task 4: Cosméticos en la tienda (cerebros)

**Files:**

- Modify: `game.js` (catálogo, state, buy/equip, serialize path via deserialize)
- Modify: `tests/logic.test.js`
- Modify: `index.html` (tab Cosméticos)
- Modify: `ui.js` (render + apply)
- Modify: `style.css` (skins/auras/fondos)
- Test: `node tests/logic.test.js`

**Catálogo locked (`Game.COSMETICS`):**

| id | name | slot | cost (brains) | notes |
|----|------|------|---------------|-------|
| `skin-classic` | Zombie clásico | skin | 0 | owned+equipped by default |
| `skin-rot` | Putrefacto | skin | 5000 | icon/filter verdoso |
| `skin-neon` | Neon infectado | skin | 50000 | glow verde fuerte |
| `skin-king` | Rey de la horda | skin | 500000 | corona/gold tint |
| `aura-none` | Sin aura | aura | 0 | default |
| `aura-green` | Aura podrida | aura | 2500 | box-shadow green en `#zombie-btn` |
| `aura-blood` | Aura sangre | aura | 25000 | box-shadow red |
| `aura-gold` | Aura dorada | aura | 250000 | box-shadow gold |
| `bg-void` | Vacío | bg | 0 | default |
| `bg-fog` | Niebla | bg | 10000 | radial fog en `#clicker-card` |
| `bg-necro` | Necrópolis | bg | 100000 | patrón/gradiente ruinoso |

**State shape:**

```js
cosmetics: {
  owned: ["skin-classic", "aura-none", "bg-void"],
  equipped: { skin: "skin-classic", aura: "aura-none", bg: "bg-void" }
}
```

**API locked:**

- `Game.buyCosmetic(state, id)` → false si no fondos / ya owned; descuenta brains; push owned.
- `Game.equipCosmetic(state, id)` → false si no owned; set `equipped[slot]`.
- `prestige(state)` **copia** `cosmetics` al newState (persisten).
- `deserialize` migra saves viejos sin cosmetics → defaults.

- [ ] **Step 1: Implementar en `game.js` + exportar en `Game`.**

- [ ] **Step 2: Tests**

```js
// buyCosmetic gasta cerebros y marca owned
// equipCosmetic requiere owned
// prestige conserva cosmetics
// deserialize sin cosmetics → defaults
```

- [ ] **Step 3: Tab `Cosméticos` en shop**

Añadir botón `#shop-tab-cosmetics` y `#shop-list-cosmetics`. Extender `setupShopTabs()`.

- [ ] **Step 4: UI lista**

Cards por ítem: icono, nombre, slot, costo o “Equipado”/“Comprado”.
Click: si no owned → buy; si owned → equip. Toast corto al comprar/equipar.

- [ ] **Step 5: `applyCosmetics()`**

Poner `data-skin`, `data-aura`, `data-bg` en `#clicker-card` o `#zombie-btn` según equipped. CSS:

```css
#clicker-card[data-skin="skin-neon"] #zombie-icon { filter: ... }
#zombie-btn[data-aura="aura-green"] { box-shadow: ... }
#clicker-card[data-bg="bg-fog"] { background: ... }
```

Llamar tras load, buy, equip, prestige.

- [ ] **Step 6: Patch-render**

Lista de cosméticos también update-in-place (misma regla que Task 1); no wipe cada tick.

**Done when:** tests verdes; comprar/equipar cambia look del clicker; prestige no borra cosméticos.

---

### Task 5: Tutorial in-game (incluye Almas)

**Files:**

- Modify: `index.html` (overlay)
- Modify: `style.css` (overlay)
- Modify: `ui.js` (flow)
- Modify: `game.js` (`meta.tutorialDone` en state + deserialize)
- Test: manual + logic tests para default meta

**Steps locked (array fijo):**

1. **Cerebros** — “Hacé click en el zombie para ganar cerebros. El número grande arriba es tu progreso.”
2. **Generadores** — “Comprá generadores en la tienda para ganar cerebros solos (BPS).”
3. **Mejoras** — “Las mejoras multiplican clicks o generadores. Se compran una sola vez.”
4. **Almas / Prestigio** — copy canónico (decisión 7).
5. **Cosméticos** — “En la pestaña Cosméticos podés gastar cerebros en skins y auras. No dan poder: solo estilo.”

**UX locked:**

- Overlay `#tutorial-overlay` con card, texto, botón `Siguiente` / `Empezar` en el último.
- Botón `Omitir` siempre visible.
- `meta.tutorialDone = true` al terminar u omitir; save inmediato.
- `#btn-help` reabre desde paso 1 sin resetear progreso del juego.
- No usar `alert()`.

- [ ] **Step 1: State `meta: { tutorialDone: false }`** + migrate en deserialize.

- [ ] **Step 2: Markup overlay** (hidden by default).

- [ ] **Step 3: `setupTutorial()`** en init: si `!state.meta.tutorialDone` → open; wire help/next/skip.

- [ ] **Step 4: Estilos** fullscreen dim + card centrada; animación `slideIn` existente OK.

**Done when:** primera visita muestra tutorial; omitir no vuelve solo; `?` reabre; Almas explicadas en paso 4.

---

### Task 6: Polish + regresión AFK checklist

**Files:** touch only if needed (`style.css`, `ui.js`)

- [ ] **Step 1: Checklist manual**

1. Hover generador 5s: sin flicker.
2. x1/x10/Max: clicks confiables durante BPS alto.
3. Topbar desktop: cerebros dominante; bump on change.
4. Prestigio help visible.
5. Comprar `skin-rot`, equipar, soft-reload: sigue equipado.
6. Ascender: cosméticos siguen; cerebros/gens reset.
7. Tutorial omitir → refresh → no reaparece; `?` sí.
8. `node tests/logic.test.js` OK.

- [ ] **Step 2: Si algo falla, fix mínimo en la Task dueña — no refactors extra.**

**Done when:** checklist completa.

---

## Execution notes (AFK runner)

```bash
node scripts/execute-plan-ollama.mjs --plan docs/superpowers/plans/2026-08-21-afk-ux-cosmetics-tutorial.md --task 1
node scripts/execute-plan-ollama.mjs --plan docs/superpowers/plans/2026-08-21-afk-ux-cosmetics-tutorial.md --from 1 --to 3
```

Worker policy:
- Una Task por sesión de agente cuando sea posible.
- No abrir PRs ni commits a menos que se pida.
- No “improve” tipografías/global layout fuera del alcance.
- Si `renderShop` aún limpia innerHTML tras Task 1 → Task 1 **failed**.
