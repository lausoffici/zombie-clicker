# Zombie Clicker v2 — Mejoras profundas (design doc)

## Estado actual

El juego tiene una base sólida en HTML/CSS/JS vanilla:

- Click central que genera cerebros.
- 6 generadores con curva de costo exponencial (x1.15).
- 4 upgrades multiplicadores (click x2, generador x2).
- Save en localStorage y progreso offline.
- Animaciones flotantes, estética zombie.
- Tests de lógica en Node.

Lo que le falta para sentirse "adictivo a largo plazo": **metas intermedias**, **recompensas permanentes**, **eventos sorpresa** y **calidad de vida**. La curva actual es lineal: comprás, esperás, comprás más. No hay momentos de "ahora reseteo y vuelvo 10x más fuerte" ni pequeñas dopamine hits fuera del click.

## Research resumido

Mirando referentes del género ([Cookie Clicker Heavenly Chips](https://w.atwiki.jp/cookieclickerjpn/pages/11.html), [prestige upgrades en Cookie Clicker](https://www.pocketgamer.com/cookie-clicker/heavenly-chips-guide/), [guía de mecánicas incrementales](https://gridinc.co.za/blog/incremental-games-guide)) y clickers modernos, los sistemas que más retienen son:

1. **Prestige / ascensión** — soft reset que limpia progreso temporal a cambio de un multiplicador permanente. Da el "loop exterior" del juego.
2. **Logros** — milestones pequeños que el jugador desbloquea sin esfuerzo consciente, con pequeños bonuses permanentes.
3. **Eventos aleatorios** — apariciones esporádicas (golden cookie style) que recompensan el estar atento.
4. **Compra en bloque** — QoL: comprar x10/x100/máximo de generadores de una vez.
5. **Árbol de mejoras permanentes** — gastar la moneda de prestige en upgrades que cambian cómo se juega (más barato, más offline, auto-click).
6. **Contenido numeroso** — 6 generadores se quedan cortos; la referencia usa ~20. Más generadores = más milestones.
7. **Estadísticas** — el jugador quiere ver su legado: cerebros totales, tiempo, mejor bps, etc.

## Enfoques propuestos

### A. "Full incremental" (recomendado)
Agregar todo lo anterior: QoL (buy-max), logros, eventos dorados, prestige con moneda de almas, árbol de mejoras permanentes, nuevos generadores/upgrades, estadísticas y export/import de save. Es el que más sensación de "progresión infinita" da y justifica dejarlo AFK toda la noche.

**Trade-offs:** más archivos y más tareas, pero cada pieza es aislada; si una tarea falla, el resto sigue funcionando.

### B. "Systems first"
Priorizar prestige + skill tree + achievements antes de nuevo contenido. Más profundo, menos ancho.

**Trade-offs:** sin nuevos generadores el jugador llega rápido al techo visual; la sensación de descubrimiento es menor.

### C. "Mínimo viable"
Solo buy-max + 4 generadores más + logros básicos.

**Trade-offs:** rápido de implementar, pero no resuelve la adicción a largo plazo.

**Decisión:** se implementa el enfoque A, descompuesto en 22 tareas pequeñas para el runner autónomo.

## Arquitectura v2

### Nuevos campos en el estado

```js
{
  brains: number,
  totalClicks: number,
  totalBrainsEarned: number,        // acumulado histórico (para prestige)
  bestBps: number,                  // máximo bps alcanzado
  generators: { id: count },
  upgrades: [ids],
  achievements: [ids],
  prestige: {
    souls: number,                  // moneda de ascensión disponible
    totalSoulsEarned: number,       // legacy
    upgrades: [ids]                 // mejoras permanentes compradas
  },
  startedAt: number,                // timestamp de inicio de partida
  lastSaved: number
}
```

### Nuevas APIs de Game (game.js)

- `getGlobalMultiplier(state)` — multiplicador total: 1 + almas * 0.05 + bonuses de logros + upgrades de prestige.
- `getClickValue(state)` y `getBrainsPerSecond(state)` ahora aplican `getGlobalMultiplier`.
- `getPrestigeGain(state)` — almas que otorgaría un reset ahora (`floor(sqrt(totalBrainsEarned / 1_000_000))`).
- `prestige(state)` — devuelve nuevo estado reseteado (generadores/upgrades/brains a cero) pero conservando almas + upgrades de prestige + achievements.
- `buyPrestigeUpgrade(state, id)` — gasta almas.
- `getMaxAffordable(state, id)` — cuántos generadores se pueden comprar.
- `buyGenerators(state, id, count)` — compra N generadores.
- `checkAchievements(state)` — desbloquea logros cumplidos, devuelve lista de recién desbloqueados.
- `getStats(state)` — objeto con tiempo jugado, total producido, etc.
- `exportSave(state)` / `importSave(text)` — base64/JSON.

### Datos nuevos

- `ACHIEVEMENTS` array con condición (`type: 'clicks'|'generators'|'totalBrains'|'generatorCount'`) y bonus (`+0.02` multiplicador global).
- `PRESTIGE_UPGRADES` array: mejoras permanentes con costo en almas (`soulStart` cerebros iniciales, `bpsBoost` +10%, `clickBoost` +20%, `offlineBoost` +50%, `cheaperGenerators` -10%, `autoClick` click automático cada 2s).
- Generadores extendidos de 6 a 10.
- Upgrades base extendidos a 10.

### UI (ui.js)

- Navegación por pestañas: **Juego**, **Logros**, **Prestigio**, **Estadísticas**.
- Botones x1 / x10 / xMax en cada generador.
- Toast notification system (reemplaza `alert`).
- Evento "Cerebro Dorado": elemento flotante aleatorio, clickeable, otorga instant brains o x7 bps por 30s.
- Evento "Horda": barra de vida de jefe, click rápido para derrotar, recompensa en cerebros.

## Plan de tareas (22 tareas para Ollama)

1. **buy-max** — `buyGenerators(state,id,count)`, `getMaxAffordable`, botones x1/x10/xMax.
2. **stats-core** — `totalBrainsEarned`, `bestBps`, `startedAt`; `getStats`.
3. **toast-system** — componente de toast reutilizable en UI y reemplazo del alert offline.
4. **achievements-data** — `ACHIEVEMENTS` y `checkAchievements`.
5. **achievements-ui** — panel de logros con progreso y bonuses.
6. **prestige-formula** — `getPrestigeGain`, `totalBrainsEarned` usado en tick/click.
7. **prestige-reset** — función `prestige(state)` y botón en UI.
8. **prestige-shop-data** — `PRESTIGE_UPGRADES` y `buyPrestigeUpgrade`.
9. **prestige-shop-ui** — árbol/panel de mejoras permanentes.
10. **apply-prestige-multiplier** — modificar `getClickValue` y `getBrainsPerSecond` para usar `getGlobalMultiplier`.
11. **new-generators** — extender a 10 generadores, ajustar balance base.
12. **new-base-upgrades** — 6 nuevos upgrades (global bps, auto-click, crit, cheaper).
13. **golden-brain-event** — evento aleatorio con bonus instantáneo o x7 temporal.
14. **horde-boss-event** — mini-jefe con barra de vida y recompensa.
15. **tabs-navigation** — pestañas Juego/Logros/Prestigio/Stats.
16. **stats-panel** — mostrar estadísticas en pestaña.
17. **export-import-save** — copiar/pegar save en texto.
18. **auto-click-upgrade** — click automático cuando esté comprado el upgrade de prestige.
19. **offline-cap-prestige** — el upgrade de prestige aumenta horas de offline.
20. **visual-polish-v2** — animaciones para eventos, pestañas, partículas.
21. **tests-v2** — tests para prestige, achievements, buy-max, eventos.
22. **docs-v2** — actualizar COMO-JUGAR.md y README con nuevas mecánicas.

Cada tarea es autocontenida, lleva verificación con `node --check` y/o `node tests/logic.test.js`, y no rompe las tareas anteriores.

## Criterios de éxito

- El juego sigue funcionando abriendo `index.html` sin servidor.
- Los tests viejos siguen pasando (salvo ajustes necesarios por cambios de API).
- Nuevos tests pasan.
- El loop de prestige es comprensible: el jugador sabe cuántas almas ganará, qué se resetea y qué permanece.
- La UI no se siente saturada: pestañas organizan la información.

## Notas para el runner

- Se usará un archivo `tasks-v2.json` separado del original, apuntado con `--tasks-file`.
- El runner ya soporta `num_ctx` alto y `think: false`, necesario para los prompts más grandes.
- Las tareas 10, 11, 12 y 21 son de integración: dependen de varias piezas, por lo que se colocan tarde en el plan.
