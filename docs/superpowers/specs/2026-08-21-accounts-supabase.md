# Zombie Clicker — Cuentas y save en la nube (Supabase)

## Objetivo

Que un jugador pueda crear una cuenta y retomar el mismo progreso en cualquier dispositivo, sin dejar de jugar como invitado. El ranking entre usuarios queda para un slice futuro; el schema ya deja apodos únicos y stats denormalizados.

## Locked Decisions

1. Supabase Auth + Postgres + RLS. Anon key en el cliente. Nunca `service_role` en el frontend.
2. Invitado primero: se juega sin cuenta. La cuenta es opt-in.
3. Email + contraseña (mín. 8) + apodo 3–16 `^[A-Za-z0-9_]+$`, único case-insensitive.
4. Confirmación de email OFF en el proyecto (MVP). Si está ON, el modal muestra “Revisá tu email” y no asume sesión.
5. Conflicto local vs nube: el save con **más progreso** (no el más reciente):
   - mayor `prestige.totalSoulsEarned`
   - si empatan, mayor `totalBrainsEarned`
   - si empatan, mayor `lastSaved`
   - save fresco (0 cerebros ganados, 0 clicks, 0 almas totales) pierde contra cualquiera con progreso
   - nube vacía / sin fila → se sube el local
6. `localStorage` siempre es caché. Nube es espejo con sesión.
7. Reset e import con sesión también actualizan la nube.
8. Sign out no borra local ni nube.
9. Sin UI de leaderboard. Columnas `total_brains_earned`, `prestige_souls`, `best_bps` en `saves`.
10. Anti-cheat fuera de scope (cliente trusted). Un ranking futuro necesita validación server-side.
11. Vanilla: sin npm, sin build, sin framework. SDK por CDN.
12. Servir por HTTP. `file://` rompe el SDK.
13. UI en español.

## Archivos

| Archivo | Rol |
|---------|-----|
| `game.js` | Lógica pura + `isValidDisplayName`, `isFreshState`, `pickPreferredSave`, `cloudStatsFromState` |
| `cloud.js` | Cliente Auth + pull/push. Noop si no hay config/SDK |
| `config.js` | URL + anon key (gitignored). Copiar de `config.example.js` |
| `ui.js` | Modal, merge al login, dual-write |
| `supabase/schema.sql` | Tablas, RLS, trigger, RPC |

## Setup humano (una vez)

1. Crear proyecto en [Supabase](https://supabase.com).
2. Authentication → Providers → Email ON. **Confirm email OFF**.
3. Authentication → URL Configuration: Site URL `http://localhost:8000` (o el puerto que uses).
4. SQL Editor: pegar `supabase/schema.sql`.
5. Settings → API: copiar Project URL y `anon` `public` key a `config.js`.
6. Servir el juego: `python -m http.server 8000` y abrir `http://localhost:8000`.

## Seguridad

- RLS en `saves`: solo el dueño lee/escribe `payload`.
- `profiles` es solo `id` + `display_name` + `created_at` (nombres públicos para apodo único y ranking futuro).
- El save es client-trusted: alguien puede inflar números con la anon key. Aceptable hasta que exista leaderboard competitivo.
