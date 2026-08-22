# Zombie Clicker — Ranking global de jugadores

## Objetivo

Ver un ranking público con las stats denormalizadas de todos los jugadores con cuenta (apodo + almas + cerebros totales + mejor BPS), sin exponer el `payload` del save.

## Contexto

Las cuentas (spec `2026-08-21-accounts-supabase.md`) ya guardan `total_brains_earned`, `prestige_souls` y `best_bps` en `saves`, y `display_name` en `profiles`. RLS de `saves` es own-only: el cliente **no** puede hacer `SELECT` público de esas columnas. Hace falta un RPC `SECURITY DEFINER` que devuelva solo columnas públicas.

## Locked Decisions

1. Ranking **público** (anon + authenticated). No hace falta estar logueado para verlo.
2. Orden: `prestige_souls DESC`, luego `total_brains_earned DESC`, luego `best_bps DESC`.
3. Límite fijo: **top 50**.
4. Columnas UI: `#`, Apodo, Almas, Cerebros, Mejor BPS. Sin clicks, tiempo, huesos, payload.
5. `prestige_souls` en nube = **nivel permanente** (`prestige.totalSoulsEarned` / `getSoulLevel`), no astillas ni almas gastables.
6. Anti-cheat fuera de scope (cliente trusted). Texto corto en UI: “Las stats las reporta cada jugador”.
7. UI: pestaña lateral **Ranking** (desktop) + tab mobile **Ranking**. Stats personales siguen en Stats.
8. Sin config / error de red: mensaje en español, no romper el juego.
9. Resaltar la fila del usuario logueado (clase CSS), si aparece en el top 50.
10. Vanilla; sin npm; sin backend propio. Schema + RPC en `supabase/schema.sql` (humano re-pega en SQL Editor).
11. UI en español.

## Archivos

| Archivo | Rol |
|---------|-----|
| `supabase/schema.sql` | RPC `get_leaderboard(p_limit int)` |
| `game.js` | Fix `cloudStatsFromState` → `totalSoulsEarned` |
| `cloud.js` | `fetchLeaderboard(limit)` |
| `ui.js` | Render + fetch al abrir pestaña |
| `index.html` | Tab + panel + markup tabla |
| `style.css` | Estilos ranking |
| `tests/logic.test.js` | Assert cloudStats usa totalSoulsEarned |
| `COMO-JUGAR.md` | Sección breve Ranking |

## Setup humano

Re-pegar `supabase/schema.sql` en el SQL Editor del proyecto (idempotente) para crear/actualizar el RPC.
