# Zombie Clicker — runner autónomo con Ollama

Un juego clicker incremental de temática zombie (HTML/CSS/JS vanilla, sin dependencias) que se construye solo: un LLM local ejecuta las tareas de `tasks.json` mientras vos no estás.

## Requisitos

- [Ollama](https://ollama.com) corriendo con un modelo de código (default: `qwen3.8:27b`)
- Python 3.10+ (solo librería estándar)
- Node.js (para las verificaciones automáticas de cada tarea)

## Cómo dejarlo corriendo

```bash
ollama serve          # si no está ya corriendo
python runner.py
```

Eso es todo. El runner va tarea por tarea: le pide los archivos al modelo, los escribe, corre la verificación automática y commitea. Si una tarea falla 3 veces, la marca como `blocked` y sigue con la próxima — no se cuelga.

## Comandos útiles

```bash
python runner.py --dry-run              # valida todo y muestra el estado de las tareas
python runner.py --model llama3.1       # usar otro modelo
python runner.py --only 07-upgrades     # reintentar una tarea bloqueada
```

## Archivos

- `tasks.json` — las 14 tareas del plan, con prompts autocontenidos y verificación por tarea
- `runner.py` — el loop autónomo (cliente Ollama, parser de archivos, verificación, commits)
- `state.json` — progreso (se genera solo; borrá entradas para rehacer tareas)
- `runner.log` — log completo de la corrida
- `index.html`, `game.js`, `ui.js`, `style.css` — el juego (los genera el modelo)

Cuando termina, abrí `index.html` en el navegador y a jugar.
