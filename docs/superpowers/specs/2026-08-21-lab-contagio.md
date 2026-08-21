# Oleadas 4–5 — Lab (materiales) y Contagio (segundo prestige)

**Estado:** spec diferida. **No implementar** hasta que la capa de Huesos esté **en juego** (sink + maduración, no solo el contador placeholder de oleada 1).

**Depende de:** [`2026-08-21-huesos-layer.md`](2026-08-21-huesos-layer.md) (capa 3 live).

Si se codea esto antes de huesos, el lab se convierte en otro sink de cerebros y el Contagio no tiene meta-recurso que comer.

## Oleada 4 — Lab

### Locked Decisions

1. **Dos materiales además de huesos:** `tejido` y `esencia`. Nada de un tercer tipo el día 1 del lab.
2. **Grifos:** gens altos y jefes pueden tirar tejido/esencia (tasas bajas, no BPS). Canje cerebros → tejido con **tasa que empeora** (costo geométrico). Huesos **no** se convierten a tejido 1:1.
3. **Desagüe:** 6–10 recetas **repetibles** con costo creciente. Ejemplos: suero x2 un gen (dura la run), cebo de horda (mejor jefe), catalizador de hitos (el próximo umbral cuenta como alcanzado una vez).
4. **Unlock:** gastar 1 hueso en “Abrir el lab” (mutación única de la spec de huesos).
5. **UI:** pestaña Lab. Copy en español. Sin inventario de 40 ítems.

### Techo

Si las recetas se acaban (8 compras únicas), la capa muere igual que la tienda de 14 almas. Por eso son repetibles.

## Oleada 5 — Contagio (segundo reset)

### Locked Decisions

1. Solo existe si oleadas 1–4 están live.
2. **Come:** nivel de almas y/o astillas (meta de prestige), no solo cerebros de la run.
3. **Paga:** moneda más lenta (`contagio` / “cepas”) que no se gasta en +BPS barato. Desbloquea gens 16+ **o** recetas legendarias, no las dos el mismo sprint.
4. **Pacing:** primera vez razonable en el **mes 3+** de una partida seria, no en el día 2.
5. Vanilla HTML/JS. Sin Garden, bolsa, ni 8 prestiges anidados.

## Verificación futura

- Tests de recetas: costo n+1 > costo n; materiales bajan; cerebros no suben por craftear.
- Contagio: reset deja huesos según la decisión de persistencia documentada **antes** de codear.
- Plan AFK propio; no mezclar con oleadas 0–1.

## Fuera de alcance ahora

Cualquier campo `tejido` / `esencia` / `contagio` en `game.js`. El placeholder de huesos de oleada 1 no autoriza el lab.
