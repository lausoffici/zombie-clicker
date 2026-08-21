# AGENTS.md

Guía corta para agentes (Cursor, Kimi, Orca, OpenCode, etc.) en este repo.

## Workflow (leer primero)

Fuente de verdad: **[`docs/WORKFLOW.md`](docs/WORKFLOW.md)**

| Rol | Herramienta |
|-----|-------------|
| Orchestrator (planes, features, review, monitor) | **Cursor** o **Kimi** |
| Executor AFK | **Ollama tool-loop** + `qwen3.8-agent:27b` (`scripts/execute-plan-ollama.mjs`) |
| Runtime | **Orca** (opcional) |

## Monitoring mode

Si el usuario pide **monitorear** (no construir): diagnosticar trabas, ajustar prompt/config, relanzar el executor. **No** implementar la feature vos.

## Lanzar executor

```powershell
cd C:\Users\lauta\zombie-clicker
.\scripts\run-opencode-plan.ps1 -Plan docs/superpowers/plans/<plan>.md -From 1 -To 15
# o:
node scripts/execute-plan-ollama.mjs --plan docs/superpowers/plans/<plan>.md --from 1 --to 15 --no-commit
```

OpenCode (`opencode run`) queda **experimental** con este Qwen en Windows (mismatch de nombres de tools: `read_file` vs `read`).

## Antes de implementar (orchestrator)

1. Feature no trivial → plan AFK-safe en `docs/superpowers/plans/`
2. Locked Decisions cerradas
3. Preferir lanzar el **Ollama AFK loop** en vez de codear el plan en el chat

## Constraints del juego

- Vanilla HTML/CSS/JS — sin framework, sin build, sin sonidos, **sin backend propio**
- Persistencia: `localStorage` siempre; cuentas/nube **opcionales** vía Supabase (SDK por CDN, `cloud.js`)
- Lógica en `game.js`, UI en `ui.js`, nube en `cloud.js`, estilos en `style.css`
- Tras cambios de lógica: `node tests/logic.test.js`
- UI en español
- Para probar la nube hay que servir por HTTP (`python -m http.server 8000`), no `file://`
- Claves: copiar `config.example.js` → `config.js` (gitignored). Schema en `supabase/schema.sql`

## Planes y specs

- Planes: `docs/superpowers/plans/`
- Specs: `docs/superpowers/specs/`
- Config OpenCode del repo: `opencode.json` (experimental)
