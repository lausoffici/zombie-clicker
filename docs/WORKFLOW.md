# Workflow del repo — planificar en cloud, ejecutar AFK en local

Este documento es la fuente de verdad del flujo de trabajo multi-agente de **zombie-clicker**.  
Orquestadores: **Cursor** o **Kimi**. Ejecutor AFK: **OpenCode + Ollama Qwen**.

## Roles

| Rol | Quién | Qué hace | Qué NO hace |
|-----|--------|----------|-------------|
| **Orchestrator** | Cursor o Kimi | Features, Locked Decisions, planes AFK-safe, review post-run | Implementar el plan entero si el objetivo es AFK |
| **Runtime** | Orca (recomendado) | Terminals visibles, worktrees | Reemplazar el plan |
| **Executor** | **Ollama tool-loop** (`scripts/execute-plan-ollama.mjs`) + `qwen3.8-agent:27b` | Implementar tasks del plan | Preguntar tradeoffs; inventar scope |

Regla corta: **Cursor/Kimi = cerebro. Qwen (Ollama loop) = manos. Orca = hangar.**

> **Nota OpenCode:** `opencode run` con este Qwen en Windows suele fallar el schema de tools (`read_file` vs `read`, `file_path` vs `filePath`, `&&` en PowerShell). Para AFK confiable usá el loop nativo abajo. OpenCode queda experimental (`-Engine opencode`).

## Stack de ejecución

- Juego: HTML/CSS/JS vanilla (`index.html`, `style.css`, `game.js`, `ui.js`)
- Tests: `node tests/logic.test.js`
- Executor AFK (default): `node scripts/execute-plan-ollama.mjs` (tools `read_file` / `write_file` / `replace_in_file`)
- Wrapper: `.\scripts\run-opencode-plan.ps1` (por defecto `-Engine ollama`)
- Modelo: `qwen3.8-agent:27b`  
  (Modelfile en `scripts/Modelfile.qwen38-agent` — `RENDERER qwen3.5` para tool-loops estables)
- Config OpenCode (experimental): `opencode.json`
- Planes: `docs/superpowers/plans/*.md`
- Specs: `docs/superpowers/specs/*.md`

## Flujo diario

```text
1. Orchestrator (Cursor/Kimi)
   - Pedido → Locked Decisions → plan AFK-safe en docs/superpowers/plans/

2. Lanzar OpenCode (terminal o Orca) con el prompt de la Task
   - Irse AFK

3. OpenCode/Qwen
   - Implementa, edita archivos, corre tests si el plan lo pide

4. Orchestrator al volver
   - Diff + checklist del plan → siguiente wave
```

## Cómo escribir un plan AFK-safe

Igual que antes: Locked Decisions, tasks con checkboxes, Done when, sin preguntas abiertas.  
En las notas de ejecución, apuntar a **OpenCode**, no al script viejo.

Ejemplo actual: `docs/superpowers/plans/2026-08-21-afk-ux-cosmetics-tutorial.md`

## Cómo lanzar el executor (AFK)

Precondición: `ollama serve` + modelo `qwen3.8-agent:27b` en `ollama list`.

### A) Cadena AFK de varias Tasks (recomendado — irse sin mirar)

```powershell
cd C:\Users\lauta\zombie-clicker
.\scripts\run-opencode-plan.ps1 -Plan docs/superpowers/plans/2026-08-21-desktop-clicker-focus.md -From 1 -To 15
# equivalente directo:
node scripts/execute-plan-ollama.mjs --plan docs/superpowers/plans/2026-08-21-desktop-clicker-focus.md --from 1 --to 15 --no-commit
```

Corre **en serie** (una Task tras otra), loguea en `docs/superpowers/plans/execution-log-*.md`.

### B) Una sola Task

```powershell
node scripts/execute-plan-ollama.mjs --plan docs/superpowers/plans/2026-08-21-desktop-clicker-focus.md --task 4 --no-commit
```

### C) OpenCode one-shot (experimental)

```powershell
cd C:\Users\lauta\zombie-clicker
opencode run -m ollama/qwen3.8-agent:27b --auto --title "plan-task-4" "Ejecutá SOLO la Task 4 del plan docs/superpowers/plans/2026-08-21-afk-ux-cosmetics-tutorial.md. Respetá Locked Decisions. No preguntes. Al terminar corré: node tests/logic.test.js"
```

`--auto` auto-aprueba permisos. Si falla schema de tools, volvé al path A.

### D) OpenCode TUI (experimental)

```powershell
cd C:\Users\lauta\zombie-clicker
opencode -m ollama/qwen3.8-agent:27b
```

### E) Orca + Ollama AFK loop

```powershell
orca terminal create --worktree path:C:/Users/lauta/zombie-clicker --title "qwen-afk" --command "node scripts/execute-plan-ollama.mjs --plan docs/superpowers/plans/2026-08-21-desktop-clicker-focus.md --from 1 --to 15 --no-commit" --json
```

## Monitoring mode (orchestrator)

Cuando el usuario pide **monitorear** (no construir):

1. Leer terminal / diffs / tests / `docs/superpowers/plans/execution-log-*.md`
2. Si el executor se traba: diagnosticar (Ollama down, modelo wrong, tool loop stuck), ajustar prompt/config, **relanzar** `execute-plan-ollama.mjs` o el wrapper
3. **No** implementar la feature vos
4. Anotar lessons en este doc

## División Orchestrator vs Executor

**Orchestrator sí:** planes, Locked Decisions, review, desbloquear infra/prompt.  
**Orchestrator no (modo AFK):** reimplementar el plan en paralelo.  
**Executor sí:** una Task a la vez, respetar plan, tests.  
**Executor no:** ampliar scope / balance / catálogos.

## Convenciones del juego

- Lógica `game.js`, DOM `ui.js`, look `style.css`, estructura `index.html`
- UI en español
- Sin build / framework / sonidos / backend
- Tras lógica: `node tests/logic.test.js`

## Legacy

`scripts/execute-plan-ollama.mjs` queda como **legacy**. No es el camino default. Preferir OpenCode.

## Archivos relacionados

- `AGENTS.md` — entrypoint corto
- `.cursor/rules/agent-workflow.mdc` — rule Cursor
- `opencode.json` — provider Ollama + model default del proyecto
