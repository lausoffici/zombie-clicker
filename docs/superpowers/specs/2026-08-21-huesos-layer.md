# Capa 3 — Huesos (moneda de reloj)

**Estado:** spec de diseño. **No implementar** hasta que oleadas 0–1 estén en juego y jugadas. Los campos `state.bones` y drops de eventos (dorado 10%, jefe al matar) ya existen como grifo placeholder sin sink.

**Depende de:** [`2026-08-21-balance-waves-0-1.md`](2026-08-21-balance-waves-0-1.md)

## Por qué existe

Los cerebros comen tiempo de producción. Las almas comen la run. Los **huesos comen tiempo de calendario** (volvé mañana). Si se gastan en `+10% BPS`, se vuelven cerebros con otro nombre y la capa no alarga el juego.

## Locked Decisions (cuando se implemente)

1. **No conversión 1:1 a cerebros.** Prohibido “10 huesos = 1e12 cerebros” o “hueso → x2 BPS global barato”.
2. **Caps.** Inventario máximo 8 huesos sin mutaciones de cap. Maduración offline: 1 hueso cada 20 h, tope 1 sin recoger (como Sugar Lump: hay que volver). Online: +1 cada 60 min de sesión con cap compartido.
3. **Unlock visible.** Panel Huesos tras primer prestige **o** poseer el generador `horde`. Antes: el contador del header puede mostrar 0.
4. **Sinks permitidos (mutaciones):**
   - Nivel de un generador (tipo building level): +1% BPS **de ese gen** por nivel, costo 1, 2, 3… huesos (creciente). Nunca un +BPS global de 1 hueso.
   - +1 h de cap offline (máx +8 h, costo creciente).
   - Unlock de la capa Lab (1 hueso, único) — ver spec de lab.
   - Cosmético extra (vanity, 3–8 huesos).
5. **Sinks prohibidos:** skip de prestige, multiplicador global flat, refill de astillas.
6. **Save:** `bones`, `boneCap`, `boneMatureAt` (timestamp). Persisten en prestige y en el segundo reset **salvo** que la spec de Contagio diga lo contrario.
7. **UI:** español. El jugador ve tiempo hasta el próximo hueso. No auto-recoger offline más de 1.

## Verificación futura

- Tests: madurar no pasa el cap; gastar 1 hueso no cambia `getSoulLevel`; mutación de gen solo afecta ese `getGeneratorBps`.
- `node scripts/sim-economy.mjs` no necesita modelar huesos en oleada 0–1.

## Fuera de alcance ahora

Código de sink, panel de mutaciones, timers de maduración. El grifo de eventos de oleada 1 se queda.
