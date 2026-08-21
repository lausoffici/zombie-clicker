#!/usr/bin/env python3
"""Runner autonomo: ejecuta las tareas de tasks.json con un LLM local (Ollama).

Uso:
    python runner.py                 # corre todas las tareas pendientes
    python runner.py --model qwen3.6:35b
    python runner.py --dry-run       # valida todo sin escribir ni llamar tareas
    python runner.py --only 05-first-generator

Solo usa la libreria estandar de Python.
"""

import argparse
import json
import logging
import re
import subprocess
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
TASKS_FILE = BASE_DIR / "tasks.json"
STATE_FILE = BASE_DIR / "state.json"
DASHBOARD_FILE = BASE_DIR / "dashboard.json"
LOG_FILE = BASE_DIR / "runner.log"
OLLAMA_URL = "http://localhost:11434"
DEFAULT_MODEL = "qwen3.8:27b"
DEFAULT_NUM_CTX = 16384
MAX_ATTEMPTS = 3
REQUEST_TIMEOUT = 3600  # los modelos locales grandes pueden tardar
VERIFY_TIMEOUT = 180
CONTEXT_FILES = ["index.html", "style.css", "game.js", "ui.js", "tests/logic.test.js"]
CONTEXT_MAX_CHARS = 12000  # por archivo

FILE_BLOCK_RE = re.compile(r"<<<FILE:\s*(.+?)\s*>>>\s*\n(.*?)<<<END>>>", re.DOTALL)

SYSTEM_PROMPT = """Sos un programador que construye un juego paso a paso. Respondes SOLO con archivos completos en este formato exacto:

<<<FILE: ruta/archivo.ext>>>
(contenido completo del archivo)
<<<END>>>

Reglas:
- Escribi el contenido COMPLETO de cada archivo, nunca fragmentos ni "...".
- No agregues explicaciones, markdown ni texto fuera de los bloques FILE.
- Respeta exactamente el CONTRATO DE API que se te da: nombres de funciones, ids del DOM y formato del estado son obligatorios.
- Solo crea o modifica los archivos que la tarea pide.
"""


def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.FileHandler(LOG_FILE, encoding="utf-8"),
            logging.StreamHandler(sys.stdout),
        ],
    )


def write_dashboard(tasks, state, current_task=None, current_attempt=None, message="Esperando..."):
    total = len(tasks)
    done = sum(1 for t in tasks if state.get(t["id"]) == "done")
    blocked = sum(1 for t in tasks if state.get(t["id"]) == "blocked")
    pending = total - done - blocked
    progress = round(100 * done / total, 1) if total else 0
    payload = {
        "total": total,
        "done": done,
        "blocked": blocked,
        "pending": pending,
        "progress_pct": progress,
        "current_task": current_task,
        "current_attempt": current_attempt,
        "message": message,
        "updated_at": time.strftime("%H:%M:%S"),
    }
    try:
        with open(DASHBOARD_FILE, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False)
    except OSError as e:
        logging.warning("No se pudo escribir dashboard.json: %s", e)


def load_tasks(tasks_file):
    path = BASE_DIR / tasks_file
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return data


def load_state():
    if STATE_FILE.exists():
        with open(STATE_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_state(state):
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)


def check_ollama(model):
    try:
        with urllib.request.urlopen(f"{OLLAMA_URL}/api/tags", timeout=10) as r:
            tags = json.load(r)
    except (urllib.error.URLError, OSError) as e:
        return False, f"No se pudo conectar a Ollama en {OLLAMA_URL}: {e}"
    models = [m.get("name", "") for m in tags.get("models", [])]
    if model not in models:
        return False, f"El modelo '{model}' no esta en Ollama. Disponibles: {', '.join(models)}"
    return True, f"Ollama OK, modelo '{model}' disponible."


def call_ollama(model, messages, num_ctx):
    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
        # num_ctx: el default de Ollama es 4096 y el prompt solo ya lo llena,
        # lo que truncaba las respuestas (done_reason: length, content vacio).
        # think: false porque el modo thinking gastaba todo el presupuesto de
        # tokens en razonamiento y devolvia content vacio.
        "think": False,
        "options": {"temperature": 0.2, "num_ctx": num_ctx},
    }
    req = urllib.request.Request(
        f"{OLLAMA_URL}/api/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as r:
        resp = json.load(r)
    return resp["message"]["content"]


def build_context():
    parts = []
    for rel in CONTEXT_FILES:
        p = BASE_DIR / rel
        if p.exists():
            content = p.read_text(encoding="utf-8", errors="replace")
            if len(content) > CONTEXT_MAX_CHARS:
                content = content[:CONTEXT_MAX_CHARS] + "\n... (truncado)"
            parts.append(f"--- contenido actual de {rel} ---\n{content}")
    return "\n\n".join(parts)


def parse_file_blocks(text):
    files = {}
    for path, content in FILE_BLOCK_RE.findall(text):
        path = path.strip().strip("`")
        # seguridad: solo rutas relativas dentro del proyecto
        target = (BASE_DIR / path).resolve()
        if not str(target).startswith(str(BASE_DIR)) or Path(path).is_absolute():
            logging.warning("Ruta rechazada por seguridad: %s", path)
            continue
        files[path] = content
    return files


def write_files(files):
    for path, content in files.items():
        target = BASE_DIR / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        logging.info("  escrito: %s (%d bytes)", path, len(content))


def run_verify(command):
    result = subprocess.run(
        command,
        shell=True,
        cwd=BASE_DIR,
        capture_output=True,
        text=True,
        timeout=VERIFY_TIMEOUT,
    )
    output = ((result.stdout or "") + (result.stderr or "")).strip()
    return result.returncode == 0, output


def git_commit(message):
    try:
        subprocess.run(["git", "add", "-A"], cwd=BASE_DIR, check=True,
                       capture_output=True, timeout=60)
        subprocess.run(["git", "commit", "-m", message], cwd=BASE_DIR,
                       check=True, capture_output=True, timeout=60)
        logging.info("  commit: %s", message)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
        logging.warning("  git commit fallo (se continua igual): %s", e)


def run_task(model, num_ctx, data, task, state):
    task_id = task["id"]
    logging.info("=== Tarea %s: %s ===", task_id, task["title"])

    contract = "\n".join(data.get("contract", []))
    base_prompt = (
        f"Proyecto: {data['project']}\n\n"
        f"{contract}\n\n"
        f"CONTEXTO (archivos actuales del proyecto):\n{build_context() or '(proyecto vacio)'}\n\n"
        f"TAREA: {task['prompt']}"
    )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": base_prompt},
    ]

    last_error = ""
    for attempt in range(1, MAX_ATTEMPTS + 1):
        write_dashboard(data["tasks"], state, current_task=f"{task_id}: {task['title']}",
                        current_attempt=f"{attempt}/{MAX_ATTEMPTS}",
                        message=f"Ejecutando {task_id} (intento {attempt}/{MAX_ATTEMPTS})")
        logging.info("  intento %d/%d (llamando a %s)...", attempt, MAX_ATTEMPTS, model)
        started = time.time()
        try:
            response = call_ollama(model, messages, num_ctx)
        except (urllib.error.URLError, OSError, TimeoutError, KeyError) as e:
            last_error = f"error llamando a Ollama: {e}"
            logging.error("  %s", last_error)
            continue
        elapsed = time.time() - started
        logging.info("  respuesta recibida en %.0fs (%d chars)", elapsed, len(response))

        files = parse_file_blocks(response)
        if not files:
            last_error = "la respuesta no contenia bloques <<<FILE: ...>>> validos"
            logging.warning("  %s", last_error)
            messages.append({"role": "assistant", "content": response})
            messages.append({"role": "user", "content":
                "ERROR: no detecte ningun bloque <<<FILE: ruta>>> ... <<<END>>>. "
                "Responde SOLO con bloques FILE completos, sin explicaciones."})
            continue

        write_files(files)

        ok, output = run_verify(task["verify"])
        if ok:
            logging.info("  verificacion OK")
            state[task_id] = "done"
            save_state(state)
            write_dashboard(data["tasks"], state, message=f"{task_id} completada")
            git_commit(f"{task_id}: {task['title']}")
            return True

        last_error = output[-3000:] if output else "verify fallo sin salida"
        logging.warning("  verificacion FALLO: %s", last_error[:500])
        messages.append({"role": "assistant", "content": response})
        messages.append({"role": "user", "content":
            f"La verificacion automatica fallo con este error:\n\n{last_error}\n\n"
            "Corregi los archivos y responde SOLO con los bloques FILE completos corregidos."})

    logging.error("  tarea %s BLOQUEADA tras %d intentos", task_id, MAX_ATTEMPTS)
    state[task_id] = "blocked"
    save_state(state)
    write_dashboard(data["tasks"], state, message=f"{task_id} bloqueada tras {MAX_ATTEMPTS} intentos")
    return False


def main():
    parser = argparse.ArgumentParser(description="Runner autonomo de tareas con Ollama")
    parser.add_argument("--tasks-file", default="tasks.json",
                        help="archivo JSON con las tareas (default: %(default)s)")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="modelo de Ollama a usar")
    parser.add_argument("--num-ctx", type=int, default=DEFAULT_NUM_CTX,
                        help="ventana de contexto en tokens (default: %(default)s)")
    parser.add_argument("--dry-run", action="store_true",
                        help="valida tasks.json y la conexion con Ollama sin ejecutar nada")
    parser.add_argument("--only", metavar="TASK_ID", help="ejecuta una sola tarea")
    parser.add_argument("--retry-blocked", action="store_true",
                        help="reintenta tareas bloqueadas en bucle hasta que todas pasen")
    parser.add_argument("--retry-delay", type=int, default=60,
                        help="segundos de espera entre reintentos de bloqueadas (default: %(default)s)")
    args = parser.parse_args()

    setup_logging()
    data = load_tasks(args.tasks_file)
    tasks = data["tasks"]

    # validacion de tasks.json
    ids = [t["id"] for t in tasks]
    if len(ids) != len(set(ids)):
        logging.error("tasks.json tiene ids duplicados")
        return 1
    for t in tasks:
        for key in ("id", "title", "prompt", "verify"):
            if key not in t:
                logging.error("tarea %s: falta el campo '%s'", t.get("id", "?"), key)
                return 1
    logging.info("tasks.json valido: %d tareas", len(tasks))

    ok, msg = check_ollama(args.model)
    logging.info(msg)
    if not ok:
        return 1

    if args.dry_run:
        state = load_state()
        for t in tasks:
            status = state.get(t["id"], "pending")
            print(f"  [{status:7s}] {t['id']}: {t['title']}")
        print("Dry-run OK. Ejecuta 'python runner.py' para empezar.")
        return 0

    state = load_state()
    write_dashboard(tasks, state, message="Runner iniciado, esperando primera tarea")

    while True:
        todo = [t for t in tasks if state.get(t["id"]) != "done"]
        if args.only:
            todo = [t for t in tasks if t["id"] == args.only]
            if not todo:
                logging.error("no existe la tarea '%s'", args.only)
                return 1
        else:
            # sin retry, saltamos las bloqueadas como antes
            if not args.retry_blocked:
                todo = [t for t in todo if state.get(t["id"]) != "blocked"]

        if not todo:
            logging.info("No hay tareas pendientes. Todo terminado.")
            write_dashboard(tasks, state, message="Todas las tareas completadas")
            break

        logging.info("Tareas a ejecutar en este ciclo: %d", len(todo))
        for task in todo:
            run_task(args.model, args.num_ctx, data, task, state)

        if args.only:
            break

        blocked = [t["id"] for t in tasks if state.get(t["id"]) == "blocked"]
        if not blocked:
            break
        if not args.retry_blocked:
            break
        write_dashboard(tasks, state, message=f"Reintentando {len(blocked)} tareas bloqueadas en {args.retry_delay}s")
        logging.info("%d tareas bloqueadas; reintentando en %d segundos...",
                     len(blocked), args.retry_delay)
        time.sleep(args.retry_delay)

    done = sum(1 for t in tasks if state.get(t["id"]) == "done")
    blocked = [t["id"] for t in tasks if state.get(t["id"]) == "blocked"]
    logging.info("=== RESUMEN: %d/%d tareas completadas ===", done, len(tasks))
    write_dashboard(tasks, state, message=f"Resumen: {done}/{len(tasks)} completadas")
    if blocked:
        logging.info("Bloqueadas (reintentar con --only o --retry-blocked): %s",
                     ", ".join(blocked))
    return 0 if not blocked else 2


if __name__ == "__main__":
    sys.exit(main())
