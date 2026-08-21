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

### Dashboard de progreso

El runner escribe `dashboard.json` en tiempo real. Abrí una terminal aparte en la misma carpeta y levantá un servidor local:

```bash
python -m http.server 8000
```

Luego abrí en el navegador: **http://localhost:8000/dashboard.html**

Ahí ves la barra de progreso, tarea actual, intento y cuántas están completadas/bloqueadas/pendientes.

### Para que no quede nada bloqueado

```bash
python runner.py --tasks-file tasks-v2.json --retry-blocked
```

Con `--retry-blocked`, si una tarea se bloquea espera 60 segundos y la reintenta indefinidamente hasta que pase.

### Correr mejoras v2

```bash
python runner.py --tasks-file tasks-v2.json
```

## Comandos útiles

```bash
python runner.py --dry-run                    # valida todo y muestra el estado
python runner.py --model llama3.1             # usar otro modelo
python runner.py --only 07-upgrades           # reintentar una tarea bloqueada
python runner.py --tasks-file tasks-v2.json   # ejecutar plan de mejoras
python runner.py --tasks-file tasks-v2.json --retry-blocked  # reintentar bloqueadas
```

## Archivos

- `tasks.json` / `tasks-v2.json` — planes de tareas autocontenidos
- `runner.py` — el loop autónomo (cliente Ollama, parser, verificación, commits, dashboard)
- `state.json` — progreso (se genera solo)
- `runner.log` — log completo
- `dashboard.json` — estado en tiempo real para el dashboard
- `dashboard.html` — dashboard visual
- `index.html`, `game.js`, `ui.js`, `style.css` — el juego

Cuando termina, abrí `index.html` en el navegador y a jugar.
