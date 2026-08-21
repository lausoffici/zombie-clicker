# Zombie Clicker — Oleadas 0–1 (economía larga)

Spec ejecutable. Stack: HTML/CSS/JS vanilla. Lógica en `game.js`, UI en `ui.js`, tests en `node tests/logic.test.js`, simulación en `node scripts/sim-economy.mjs`.

Oleadas 2–5 (árbol enorme, huesos como sink, lab, segundo prestige) **no** se implementan aquí. Ver specs `2026-08-21-huesos-layer.md` y `2026-08-21-lab-contagio.md`.

## Locked Decisions

1. **Nivel ≠ chips.** `prestige.totalSoulsEarned` es el nivel de almas: nunca baja. El multiplicador global usa `+5%` por nivel (`totalSoulsEarned`), no por chips. `prestige.soulChips` es lo que se gasta en la tienda de prestige y en cosméticos. `prestige.souls` en save nuevo es un alias de display del **nivel** (igual a `totalSoulsEarned`).
2. **Migración de saves viejos.** Si no existe `soulChips`: `soulChips = prestige.souls` (pool gastable antiguo). El nivel queda en `totalSoulsEarned` (si falta, `max(souls, 0)`). Gastar chips **no** reduce el nivel ni el +5%/alma.
3. **Fórmula de prestige (por run).** `floor(sqrt(totalBrainsEarned / 1e9))`. Primera alma a 1e9 cerebros de la run. Al ascender se resetean cerebros/gens/mejoras de run; se conservan logros, cosmética, huesos, nivel, chips, upgrades de prestige, `prestigeCount`.
4. **Al ascender.** `gain = getPrestigeGain(state)`; `totalSoulsEarned += gain`; `soulChips += gain`; `prestigeCount += 1`.
5. **`clickBoost`** (prestige) solo multiplica el valor de click. **No** entra en `getGlobalMultiplier` ni en BPS.
6. **Hitos de generador (gratis).** Umbrales `[25, 50, 100, 200, 400]`. Cada umbral alcanzado duplica el BPS de **ese** generador (`x2` acumulativo). Visible en la tarjeta.
7. **Mejoras de tienda por gen.** Tres tiers por generador: x2 al tener 1 / 50 / 100 de ese gen. Las 5 mejoras legacy (`superviviente-veloz` … `jefe-alpha`) son el tier 1 de esos gens. Tiers 50/100 y gens 6–15 usan ids `up-<genId>-50` / `up-<genId>-100` / `up-<genId>-1`. UI: no mostrar si `unlockCount` no se cumple.
8. **15 generadores.** Los 10 actuales más `cementerio`, `plaga-mundial`, `dimension-rota`, `trono-huesos`, `vacio-verdoso` (costos/BPS en `game.js`). Crecimiento de costo `1.15`.
9. **~40 logros.** Incluyen cerebros, clicks, cantidad de gens, prestige, BPS, huesos, hitos, ejército de 15. Bonus típico +2% global.
10. **Huesos (placeholder de capa B).** Campo `state.bones` (número ≥ 0). Persiste en prestige. **No** hay tienda de huesos en esta oleada. Eventos pueden sumar huesos.
11. **Cerebro dorado.** Con roll `< 0.10` otorga **+1 hueso**; si no, cerebros `max(100, floor(BPS * 30))`. API: `Game.applyGoldenBrain(state, roll)`.
12. **Jefe de la horda.** Combate por clicks (HP), no x5 BPS automático. HP = `min(80, 15 + 5 * nivelAlmas)`. Cada click al jefe resta 1 HP. Al matar: `Game.applyBossKill(state)` → cerebros `max(500, floor(BPS * 60))` **y** +1 hueso.
13. **Cosméticos.** Vanity. Costo en **astillas** (`soulChips`), no cerebros. Ids y slots no cambian. Costos: rot 1, neon 2, king 5, aura-green 1, aura-blood 2, aura-gold 4, bg-fog 1, bg-necro 3. Gratis siguen en 0.
14. **Copy UI en español.** Almas = nivel permanente (+5%). Astillas = se gastan. Huesos = se acumulan (aún no se gastan). Fórmula visible: `floor(sqrt(cerebrosDeLaRun / 1e9))`. Consejo: “Conviene ascender cuando puedas duplicar tu nivel de almas.”
15. **Fuera de alcance.** Árbol de prestige repetible (oleada 2), sink de huesos (oleada 3), lab/materiales (4), segundo reset (5), sonidos, backend, React.

## Estado (campos nuevos o cambiados)

```js
{
  bones: 0,
  prestigeCount: 0,
  prestige: {
    souls: 0,              // alias de nivel (= totalSoulsEarned)
    totalSoulsEarned: 0,   // nivel, nunca baja
    soulChips: 0,          // gastable
    upgrades: []
  }
}
```

## APIs Game nuevas o cambiadas

- `getSoulLevel(state)`, `getSoulChips(state)`
- `getMilestoneMultiplier(ownedCount)`, `MILESTONE_THRESHOLDS`
- `isUpgradeVisible(state, upgrade)`
- `normalizePrestige(raw)` usado por `createState` / `deserialize` / `prestige`
- `applyGoldenBrain(state, roll)`, `applyBossKill(state)`, `getBossMaxHp(state)`
- `buyPrestigeUpgrade` y `buyCosmetic` descuentan `soulChips`
- `formatNumber` con sufijos hasta Dc (1e33)

## Verificación

- `node tests/logic.test.js`
- `node scripts/sim-economy.mjs` (reporte; no debe crashear)
- Invariantes: gastar chips no baja `totalSoulsEarned`; `clickBoost` no sube BPS.
