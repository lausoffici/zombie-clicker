# Zombie Clicker — Mejoras multi-nivel + progreso visible

> **For agentic workers:** Implement **one Task at a time**. Do not ask clarifying questions — all product decisions are locked below. If blocked by a missing file/ID, fail the task with a short summary; do not invent new systems outside this plan. Use checkbox (`- [ ]`) tracking. After each task that touches logic: `node tests/logic.test.js` must pass.

**Goal:** Convertir mejoras de compra única a multi-nivel (max 5), ampliar catálogo (+6), y mostrar en cada carta `Lv N/5` + barra de progreso hacia el próximo costo.

**Architecture:** Vanilla. Lógica en `game.js` (`state.upgrades` = map id→nivel). UI patch in-place en `ui.js`. Estilos en `style.css`.

**Tech Stack:** HTML5, CSS3, JavaScript ES5/IIFE, localStorage. Sin frameworks, sin build, sin sonidos, sin backend.

---

## Locked Decisions (NO preguntar)

1. **Estado:** `state.upgrades` es `{ [id]: number }` (nivel ≥ 0). Nivel 0 = no comprada.
2. **Migración save:** array de ids → cada id nivel 1; object → clamp 0..maxLevel; falta → `{}`.
3. **Prestigio:** al ascender, `upgrades` → `{}`.
4. **Catálogo:** `baseCost`, `costGrowth: 2.5`, `maxLevel: 5`, `perLevel`, `type` (+ `generatorId` si aplica).
5. **Costo:** `Math.ceil(baseCost * Math.pow(costGrowth, level))`; si `level >= maxLevel` no comprable.
6. **Efectos:** click/generator `Math.pow(perLevel, level)`; global `+=(perLevel-1)*level`; crit `perLevel*level` chance ×10 hit; cheaper `Math.pow(1-perLevel, level)` en costos de gens.
7. **Retune 10 existentes + 6 nuevas** — tablas del plan Cursor (ids fijos).
8. **API:** `getUpgradeLevel`, `getUpgradeCost`, `getCritChance`; `buyUpgrade` +1 nivel.
9. **UI:** cartas siempre visibles; `Lv N/5`; barra `.upgrade-progress`; maxeada = `owned maxed` + `MÁX`.
10. **UI español.** Actualizar `COMO-JUGAR.md`.
11. **No tocar** prestige upgrades / cosméticos / generadores base (salvo aplicar cheaper run).

## Global Constraints

- `node tests/logic.test.js` pasa tras tasks de lógica.
- `game.js` = lógica pura; `ui.js` = DOM; `style.css` = look.
- No commits salvo que el runner pase `--commit`.

---

### Task 1: Plan file presente

- [ ] Confirmar este archivo existe en `docs/superpowers/plans/`.

### Task 2: Logic core — niveles, costos, efectos click/gen/global, migrate

**Files:** `game.js`, `tests/logic.test.js`

- [ ] `createState().upgrades = {}`
- [ ] Helpers + `buyUpgrade` multi-nivel
- [ ] Efectos click/generator/global con niveles
- [ ] `deserialize` migra array→map
- [ ] Tests actualizados; `node tests/logic.test.js` pasa

### Task 3: crit + cheaper + 6 upgrades nuevos

**Files:** `game.js`, `tests/logic.test.js`

- [ ] Tipos `crit` / `cheaper` + 6 entradas de catálogo
- [ ] `click()` aplica crit; `getGeneratorCost` / `getMaxAffordable` aplican cheaper
- [ ] Tests; suite verde

### Task 4: UI progreso

**Files:** `ui.js`, `style.css`

- [ ] `buildUpgradeCard` / `patchUpgrades` con Lv + barra + desc dinámica
- [ ] No remover cartas; maxeada visible
- [ ] Estilos `.upgrade-progress`, `.maxed`

### Task 5: Docs + verify

**Files:** `COMO-JUGAR.md`

- [ ] Documentar multi-nivel y barra
- [ ] `node tests/logic.test.js` pasa
