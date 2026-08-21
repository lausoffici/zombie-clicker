#!/usr/bin/env node
/**
 * Execute the Zombie Clicker redesign plan via local Ollama (qwen3.8:27b).
 *
 * Usage:
 *   node scripts/execute-plan-ollama.mjs
 *   node scripts/execute-plan-ollama.mjs --task 1
 *   node scripts/execute-plan-ollama.mjs --from 1 --to 3
 *   node scripts/execute-plan-ollama.mjs --list
 *   node scripts/execute-plan-ollama.mjs --commit
 *   node scripts/execute-plan-ollama.mjs --model qwen3.8:27b --think
 *
 * Requires: ollama serve + model pulled (ollama list should show qwen3.8:27b)
 */

import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const DEFAULTS = {
  // qwen3.8-agent:27b = qwen3.8:27b weights + RENDERER qwen3.5
  // (avoids Ollama bug: "no user query found in messages" on tool loops)
  model: "qwen3.8-agent:27b",
  host: "http://127.0.0.1:11434",
  plan: path.join(
    ROOT,
    "docs",
    "superpowers",
    "plans",
    "2026-08-21-afk-ux-cosmetics-tutorial.md"
  ),
  maxIters: 30,
  numCtx: 32768,
  temperature: 0.15,
  think: false,
  commit: false,
  skipBaseline: false,
};

// Empty by default. Plans that need logic (e.g. cosmetics) must edit game.js.
// Re-add filenames here only for plans that explicitly forbid touching them.
const READONLY_FILES = new Set([]);
const ALLOWED_WRITE_EXTS = new Set([".html", ".css", ".js", ".md", ".json", ".txt"]);
const FORBIDDEN_WRITE_DIRS = new Set([".git", "node_modules", ".cursor"]);

function parseArgs(argv) {
  const opts = { ...DEFAULTS, from: null, to: null, task: null, list: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--model") opts.model = next();
    else if (a === "--host") opts.host = next();
    else if (a === "--plan") opts.plan = path.resolve(ROOT, next());
    else if (a === "--task") opts.task = Number(next());
    else if (a === "--from") opts.from = Number(next());
    else if (a === "--to") opts.to = Number(next());
    else if (a === "--max-iters") opts.maxIters = Number(next());
    else if (a === "--num-ctx") opts.numCtx = Number(next());
    else if (a === "--temperature") opts.temperature = Number(next());
    else if (a === "--think") opts.think = true;
    else if (a === "--no-think") opts.think = false;
    else if (a === "--commit") opts.commit = true;
    else if (a === "--no-commit") opts.commit = false;
    else if (a === "--skip-baseline") opts.skipBaseline = true;
    else if (a === "--list") opts.list = true;
    else if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    } else throw new Error(`Unknown arg: ${a}`);
  }
  return opts;
}

function printHelp() {
  console.log(`Execute redesign plan with local Ollama.

Options:
  --model NAME         Ollama model (default: qwen3.8-agent:27b)
  --host URL           Ollama base URL (default: http://127.0.0.1:11434)
  --plan PATH          Plan markdown path
  --task N             Run only task N
  --from N --to N      Run a task range (inclusive)
  --list               List parsed tasks and exit
  --max-iters N        Max tool rounds per task (default: 24)
  --num-ctx N          Context tokens (default: 32768)
  --temperature N      Sampling temperature (default: 0.15)
  --think / --no-think Enable/disable model thinking (default: off)
  --commit / --no-commit Git commit after each task (default: off)
`);
}

function log(...args) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}]`, ...args);
}

function resolveSafe(relOrAbs) {
  const abs = path.isAbsolute(relOrAbs)
    ? path.normalize(relOrAbs)
    : path.resolve(ROOT, relOrAbs);
  const rel = path.relative(ROOT, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Path escapes repo root: ${relOrAbs}`);
  }
  const top = rel.split(/[/\\]/)[0];
  if (FORBIDDEN_WRITE_DIRS.has(top)) {
    throw new Error(`Path in forbidden directory: ${rel}`);
  }
  return { abs, rel: rel.replace(/\\/g, "/") || "." };
}

async function readText(relOrAbs) {
  const { abs, rel } = resolveSafe(relOrAbs);
  return { rel, content: await fs.readFile(abs, "utf8") };
}

async function writeText(relOrAbs, content) {
  const { abs, rel } = resolveSafe(relOrAbs);
  const base = path.basename(rel);
  if (READONLY_FILES.has(base)) {
    throw new Error(`Refusing to modify read-only file: ${base}`);
  }
  const ext = path.extname(rel).toLowerCase();
  if (ext && !ALLOWED_WRITE_EXTS.has(ext)) {
    throw new Error(`Write blocked for extension ${ext}: ${rel}`);
  }
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, content, "utf8");
  return rel;
}

async function replaceInFile(relOrAbs, oldText, newText, replaceAll = false) {
  const { abs, rel } = resolveSafe(relOrAbs);
  if (READONLY_FILES.has(path.basename(rel))) {
    throw new Error(`Refusing to modify read-only file: ${rel}`);
  }
  const before = await fs.readFile(abs, "utf8");
  const tryMatch = (hay, needle) => {
    if (hay.includes(needle)) return { hay, needle, mode: "exact" };
    const hayN = hay.replace(/\r\n/g, "\n");
    const needleN = needle.replace(/\r\n/g, "\n");
    if (hayN.includes(needleN)) return { hay: hayN, needle: needleN, mode: "lf" };
    return null;
  };
  const match = tryMatch(before, oldText);
  if (!match) {
    throw new Error(
      `old_text not found in ${rel}. Tip: use write_file for large edits, or smaller unique old_text (CRLF-safe).`
    );
  }
  const newNorm =
    match.mode === "lf" ? newText.replace(/\r\n/g, "\n") : newText;
  let afterNorm = replaceAll
    ? match.hay.split(match.needle).join(newNorm)
    : match.hay.replace(match.needle, newNorm);
  // Preserve original newline style when we normalized to LF for matching
  if (match.mode === "lf" && before.includes("\r\n")) {
    afterNorm = afterNorm.replace(/\n/g, "\r\n");
  }
  await fs.writeFile(abs, afterNorm, "utf8");
  return { rel, changed: before !== afterNorm, match_mode: match.mode };
}

function runCommand(command, timeoutMs = 120000) {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd: ROOT,
      shell: true,
      windowsHide: true,
      env: process.env,
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      resolve({
        ok: false,
        code: null,
        stdout,
        stderr: stderr + `\n[timeout after ${timeoutMs}ms]`,
      });
    }, timeoutMs);
    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, code, stdout, stderr });
    });
  });
}

function parseTasks(markdown) {
  const lines = markdown.split(/\r?\n/);
  const tasks = [];
  let current = null;
  for (const line of lines) {
    const m = line.match(/^### Task (\d+):\s*(.+)\s*$/);
    if (m) {
      if (current) tasks.push(current);
      current = {
        id: Number(m[1]),
        title: m[2].trim(),
        body: "",
      };
      continue;
    }
    if (current) {
      if (/^### Task \d+:/.test(line) || /^## Self-Review/.test(line)) {
        tasks.push(current);
        current = null;
        if (/^## Self-Review/.test(line)) break;
        continue;
      }
      current.body += line + "\n";
    }
  }
  if (current) tasks.push(current);
  return tasks;
}

function selectTasks(tasks, opts) {
  if (opts.task != null) {
    const t = tasks.find((x) => x.id === opts.task);
    if (!t) throw new Error(`Task ${opts.task} not found`);
    return [t];
  }
  let from = opts.from ?? tasks[0]?.id ?? 1;
  let to = opts.to ?? tasks[tasks.length - 1]?.id ?? from;
  return tasks.filter((t) => t.id >= from && t.id <= to);
}

const TOOLS = [
  {
    type: "function",
    function: {
      name: "list_dir",
      description: "List files in a directory relative to the repo root.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative directory path (default .)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read a UTF-8 text file from the repo.",
      parameters: {
        type: "object",
        required: ["path"],
        properties: {
          path: { type: "string" },
          start_line: { type: "integer", description: "1-based start (optional)" },
          end_line: { type: "integer", description: "1-based inclusive end (optional)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description:
        "Overwrite/create a text file. Prefer for full rewrites from the plan.",
      parameters: {
        type: "object",
        required: ["path", "content"],
        properties: {
          path: { type: "string" },
          content: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "replace_in_file",
      description:
        "Exact string replace in a file. Prefer for small surgical edits.",
      parameters: {
        type: "object",
        required: ["path", "old_text", "new_text"],
        properties: {
          path: { type: "string" },
          old_text: { type: "string" },
          new_text: { type: "string" },
          replace_all: { type: "boolean" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_command",
      description:
        "Run a shell command in the repo root. Allowed: node tests/logic.test.js, git status/diff/add/commit (only if commits enabled).",
      parameters: {
        type: "object",
        required: ["command"],
        properties: {
          command: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "task_done",
      description:
        "Call when the task steps are implemented and verified (tests pass when required).",
      parameters: {
        type: "object",
        required: ["summary"],
        properties: {
          summary: { type: "string" },
          tests_passed: { type: "boolean" },
        },
      },
    },
  },
];

function isCommandAllowed(command, allowCommit) {
  const c = command.trim();
  if (/^node\s+tests\/logic\.test\.js\b/.test(c)) return true;
  if (/^git\s+status\b/.test(c)) return true;
  if (/^git\s+diff\b/.test(c)) return true;
  if (/^git\s+log\b/.test(c)) return true;
  if (allowCommit && /^git\s+add\b/.test(c)) return true;
  if (allowCommit && /^git\s+commit\b/.test(c)) return true;
  return false;
}

async function execTool(name, args, opts) {
  switch (name) {
    case "list_dir": {
      const target = args.path || ".";
      const { abs, rel } = resolveSafe(target);
      const entries = await fs.readdir(abs, { withFileTypes: true });
      return {
        path: rel,
        entries: entries.map((e) => ({
          name: e.name,
          type: e.isDirectory() ? "dir" : "file",
        })),
      };
    }
    case "read_file": {
      const { rel, content } = await readText(args.path);
      const lines = content.split(/\r?\n/);
      if (args.start_line || args.end_line) {
        const start = Math.max(1, args.start_line || 1);
        const end = Math.min(lines.length, args.end_line || lines.length);
        const slice = lines.slice(start - 1, end);
        return {
          path: rel,
          start_line: start,
          end_line: end,
          content: slice
            .map((l, i) => `${String(start + i).padStart(4, " ")}|${l}`)
            .join("\n"),
        };
      }
      if (content.length > 25000) {
        return {
          path: rel,
          truncated: true,
          content:
            content.slice(0, 25000) +
            `\n\n/* truncated: ${content.length} bytes total; re-read with start_line/end_line */`,
        };
      }
      return { path: rel, content };
    }
    case "write_file": {
      const rel = await writeText(args.path, args.content);
      return { ok: true, path: rel, bytes: Buffer.byteLength(args.content, "utf8") };
    }
    case "replace_in_file": {
      return await replaceInFile(
        args.path,
        args.old_text,
        args.new_text,
        Boolean(args.replace_all)
      );
    }
    case "run_command": {
      if (!isCommandAllowed(args.command, opts.commit)) {
        return {
          ok: false,
          error:
            "Command not allowed. Use: node tests/logic.test.js, git status/diff/log" +
            (opts.commit ? ", git add/commit" : " (enable --commit for git write)"),
        };
      }
      const result = await runCommand(args.command);
      return {
        ok: result.ok,
        code: result.code,
        stdout: clip(result.stdout, 8000),
        stderr: clip(result.stderr, 4000),
      };
    }
    case "task_done": {
      return {
        __done: true,
        summary: args.summary || "",
        tests_passed: Boolean(args.tests_passed),
      };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

function clip(s, n) {
  if (!s) return "";
  return s.length <= n ? s : s.slice(0, n) + `\n…[${s.length - n} more chars]`;
}

function systemPrompt(opts) {
  return `You are a careful coding agent executing ONE implementation task from a written plan.

Repo root: ${ROOT}
Stack: vanilla HTML/CSS/JS (no npm deps for the game, no build step).
Hard rules:
1. You MAY edit game.js when the plan task requires it (catalogs, buy/equip, serialize). Do not change generator/upgrade balance numbers unless the plan says so.
2. Keep IDs/classes consistent with the plan and with each other.
3. After code changes that touch game logic wiring, run: node tests/logic.test.js
4. Do not invent balance/number changes.
5. Prefer the plan's concrete code blocks, but APPLY THE BUGFIXES below.
6. Use tools. Do not ask questions. Finish by calling task_done.
7. Git commits: ${opts.commit ? "allowed via run_command" : "DISABLED — skip commit steps"}.
8. If tests fail because Game.COSMETICS / buyCosmetic are missing, implement them in game.js FIRST before more UI edits.

Known plan bugfixes (mandatory):
- Mobile nav (Task 7 setupMobileNav): do NOT toggle the same column multiple times with Object.keys(cols).forEach. Correct pattern:
  show only col-clicker for data-mobile="game"; for achievements/prestige/stats show col-side and activate the matching side tab. Example:
  const clicker = $("col-clicker"); const side = $("col-side");
  if (target === "game") { clicker.classList.add("active"); side.classList.remove("active"); }
  else { clicker.classList.remove("active"); side.classList.add("active"); if ($("side-tab-"+target)) $("side-tab-"+target).click(); }
  Also set #col-clicker.active by default in CSS/HTML for mobile first paint.
- Task 1 vs Task 2: if implementing Task 1 alone, apply shop tab fix on current HTML. If Task 2 already rewrote HTML, skip obsolete Task 1 HTML edits and only ensure shop tab JS/CSS IDs match.
- Expose spawnGoldenBrain and spawnBoss on window.ZombieClicker when doing Task 9.
- In buyGenerator flash animation, set data-gen-id on generator cards.
- Do not add shine to every unlocked achievement on every render; only shine newly unlocked ones (track previous set or shine only when called from gameLoop newAch path).

Work style:
- Read current files before editing (usually once).
- Do NOT loop on list_dir / re-read the same file. After one read, WRITE or REPLACE.
- For large function rewrites, prefer write_file (or one big replace) over many tiny replaces.
- If replace_in_file fails with old_text not found, immediately switch to write_file for that file section — do not retry the same replace.
- Always end by calling task_done. Never reply with empty content and no tools.
- When the plan gives a full CSS/HTML/JS block, use write_file with that content (plus required bugfixes).
- Make the minimal set of edits for THIS task.
- Verify with tests when the plan says so.
- Call task_done with a short summary when finished.`;
}

function taskUserPrompt(task, opts) {
  return `Execute Task ${task.id}: ${task.title}

Plan section for this task:
---
${task.body.trim()}
---

Constraints reminder:
- Edit game.js when this task requires logic/API (e.g. COSMETICS). Otherwise prefer UI files.
- Commits ${opts.commit ? "ON" : "OFF — skip git commit steps"}
- When verification says run tests, call run_command with node tests/logic.test.js
- Start by reading the files listed in the task, then implement steps in order.
- If resuming a partial task: fix the blocker first (often missing game.js API), then finish.`;
}

function sanitizeMessagesForOllama(messages) {
  // qwen3.8 renderer is picky: empty assistant content + tool loops can 500.
  return messages.map((m) => {
    const out = { ...m };
    if (out.role === "assistant") {
      if (out.tool_calls && (!out.content || out.content === "")) {
        delete out.content;
      }
      if (out.tool_calls && out.tool_calls.length === 0) {
        delete out.tool_calls;
      }
    }
    if (out.role === "tool") {
      // Keep tool_name; ensure content is always a string
      out.content = typeof out.content === "string" ? out.content : JSON.stringify(out.content);
    }
    return out;
  });
}

async function ollamaChat(opts, messages, attempt = 1) {
  const body = {
    model: opts.model,
    messages: sanitizeMessagesForOllama(messages),
    tools: TOOLS,
    stream: false,
    think: opts.think,
    options: {
      temperature: opts.temperature,
      num_ctx: opts.numCtx,
    },
  };

  try {
    const res = await fetch(`${opts.host}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Ollama HTTP ${res.status}: ${text}`);
    }
    return res.json();
  } catch (err) {
    if (attempt < 3) {
      const wait = attempt * 4000;
      log(`  Ollama request failed (${err.message}); retry ${attempt}/3 in ${wait}ms…`);
      await new Promise((r) => setTimeout(r, wait));
      return ollamaChat(opts, messages, attempt + 1);
    }
    throw err;
  }
}

function normalizeToolCalls(message) {
  const calls = [];
  if (Array.isArray(message.tool_calls)) {
    for (const tc of message.tool_calls) {
      const fn = tc.function || {};
      let args = fn.arguments ?? {};
      if (typeof args === "string") {
        try {
          args = JSON.parse(args || "{}");
        } catch {
          args = {};
        }
      }
      calls.push({
        id: tc.id || `call_${calls.length + 1}`,
        name: fn.name,
        arguments: args,
      });
    }
  }
  return calls;
}

async function runTask(task, opts, logStream) {
  log(`▶ Task ${task.id}: ${task.title}`);
  const messages = [
    { role: "system", content: systemPrompt(opts) },
    { role: "user", content: taskUserPrompt(task, opts) },
  ];

  let done = null;
  let emptyStreak = 0;
  let lastWriteOk = false;
  for (let iter = 1; iter <= opts.maxIters; iter++) {
    log(`  iter ${iter}/${opts.maxIters}…`);
    const response = await ollamaChat(opts, messages);
    const message = response.message || {};
    const thinking = message.thinking || response.thinking;
    if (thinking && opts.think) {
      await appendLog(logStream, `\n## Task ${task.id} iter ${iter} thinking\n${clip(thinking, 4000)}\n`);
    }

    const assistantMsg = { role: "assistant" };
    if (message.content) assistantMsg.content = message.content;
    if (message.thinking) assistantMsg.thinking = message.thinking;
    if (message.tool_calls) assistantMsg.tool_calls = message.tool_calls;
    messages.push(assistantMsg);

    const calls = normalizeToolCalls(message);
    if (calls.length === 0) {
      const content = (message.content || "").trim();
      log(`  model text (${content.length} chars), no tools`);
      await appendLog(
        logStream,
        `\n## Task ${task.id} iter ${iter} assistant\n${clip(content, 6000)}\n`
      );
      emptyStreak += 1;
      if (emptyStreak >= 3 && content.length === 0) {
        throw new Error(
          `Task ${task.id}: model returned ${emptyStreak} consecutive empty replies with no tools (likely stuck after a failed replace). Aborting early — orchestrator should finish the task or retry with a smaller plan slice.`
        );
      }
      // Compact context: drop bulky early tool payloads so the model can continue
      if (emptyStreak === 1 && messages.length > 8) {
        for (let i = 2; i < messages.length - 2; i++) {
          const m = messages[i];
          if (m.role === "tool" && typeof m.content === "string" && m.content.length > 1500) {
            m.content = clip(m.content, 800) + "\n/* truncated by runner to free context */";
          }
        }
      }
      let nudge =
        "Continue using tools now. Prefer write_file/replace_in_file over more reads. Then run tests if needed and call task_done.";
      if (lastWriteOk || emptyStreak >= 2) {
        nudge =
          "STOP reading. Your previous edits may already be on disk. REQUIRED NEXT TOOLS (pick what is still missing):\n" +
          "1) game.js: ensure COSMETICS, buyCosmetic, equipCosmetic, prestige copies cosmetics, deserialize migrates cosmetics, Game exports COSMETICS/buyCosmetic/equipCosmetic\n" +
          "2) style.css: data-skin / data-aura / data-bg rules from the plan\n" +
          "3) run_command: node tests/logic.test.js\n" +
          "4) task_done\n" +
          "Prefer write_file for large game.js sections. Empty replies are forbidden.";
      }
      messages.push({ role: "user", content: nudge });
      continue;
    }

    emptyStreak = 0;

    for (const call of calls) {
      log(`  → ${call.name}`);
      let result;
      try {
        result = await execTool(call.name, call.arguments || {}, opts);
      } catch (err) {
        result = { ok: false, error: String(err.message || err) };
      }
      await appendLog(
        logStream,
        `\n## Task ${task.id} iter ${iter} tool ${call.name}\n` +
          `args: ${clip(JSON.stringify(call.arguments || {}), 2000)}\n` +
          `result: ${clip(JSON.stringify(result), 4000)}\n`
      );

      if (result && result.__done) {
        done = result;
      }
      if (
        (call.name === "replace_in_file" || call.name === "write_file") &&
        result &&
        result.ok !== false &&
        !result.error
      ) {
        lastWriteOk = true;
      }

      messages.push({
        role: "tool",
        tool_name: call.name,
        content: JSON.stringify(result),
      });
    }

    // Keep a fresh user turn after tool results (qwen3.8 renderer workaround)
    if (!done) {
      messages.push({
        role: "user",
        content: lastWriteOk
          ? "Edits applied. Do NOT re-read whole files. Finish remaining missing pieces (buyCosmetic/equipCosmetic/export/CSS/tests), then task_done."
          : "Tool results above are applied. Continue the task: edit files if needed, verify, then call task_done when finished. Do not re-list directories.",
      });
    }

    if (done) break;
  }

  if (!done) {
    throw new Error(`Task ${task.id} did not call task_done within ${opts.maxIters} iterations`);
  }

  // Always gate on logic tests after each task
  const test = await runCommand("node tests/logic.test.js");
  log(
    test.ok
      ? `  ✓ tests passed`
      : `  ✗ tests FAILED\n${clip(test.stdout + "\n" + test.stderr, 2000)}`
  );
  if (!test.ok) {
    throw new Error(`Task ${task.id}: logic tests failed after implementation`);
  }

  log(`✔ Task ${task.id} done — ${done.summary}`);
  return done;
}

async function appendLog(file, text) {
  await fs.appendFile(file, text, "utf8");
}

async function ensureOllama(opts) {
  try {
    const res = await fetch(`${opts.host}/api/tags`);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    const names = (data.models || []).map((m) => m.name);
    if (!names.includes(opts.model)) {
      throw new Error(
        `Model "${opts.model}" not found. Available: ${names.join(", ") || "(none)"}\n` +
          `Pull with: ollama pull ${opts.model}`
      );
    }
  } catch (err) {
    throw new Error(
      `Cannot reach Ollama at ${opts.host}. Is \`ollama serve\` running?\n${err.message}`
    );
  }
}

async function markPlanCheckbox(planPath, taskId, modelName) {
  // Best-effort: mark first unchecked step boxes under the task heading as done is too ambiguous.
  // Instead append a progress note file.
  const progressPath = path.join(
    ROOT,
    "docs",
    "superpowers",
    "plans",
    "execution-progress.json"
  );
  let progress = { tasks: {} };
  try {
    progress = JSON.parse(await fs.readFile(progressPath, "utf8"));
  } catch {
    /* new */
  }
  progress.tasks[String(taskId)] = {
    completedAt: new Date().toISOString(),
    model: modelName || "qwen3.8-agent:27b",
  };
  progress.lastUpdated = new Date().toISOString();
  await fs.writeFile(progressPath, JSON.stringify(progress, null, 2) + "\n", "utf8");
}

async function main() {
  const opts = parseArgs(process.argv);
  const planMd = await fs.readFile(opts.plan, "utf8");
  const tasks = parseTasks(planMd);

  if (!tasks.length) {
    throw new Error(`No tasks found in ${opts.plan}`);
  }

  if (opts.list) {
    for (const t of tasks) {
      console.log(`${String(t.id).padStart(2, "0")}. ${t.title}`);
    }
    return;
  }

  const selected = selectTasks(tasks, opts);
  await ensureOllama(opts);

  const logDir = path.join(ROOT, "docs", "superpowers", "plans");
  await fs.mkdir(logDir, { recursive: true });
  const logStream = path.join(
    logDir,
    `execution-log-${new Date().toISOString().replace(/[:.]/g, "-")}.md`
  );
  await fs.writeFile(
    logStream,
    `# Plan execution log\n\n- model: \`${opts.model}\`\n- plan: \`${path.relative(ROOT, opts.plan)}\`\n- started: ${new Date().toISOString()}\n- commit: ${opts.commit}\n`,
    "utf8"
  );

  log(`Model: ${opts.model}`);
  log(`Plan:  ${path.relative(ROOT, opts.plan)}`);
  log(`Tasks: ${selected.map((t) => t.id).join(", ")}`);
  log(`Log:   ${path.relative(ROOT, logStream)}`);

  // Baseline tests (skip when resuming a mid-task broken tree)
  if (opts.skipBaseline) {
    log("Baseline tests SKIPPED (--skip-baseline)");
  } else {
    const baseline = await runCommand("node tests/logic.test.js");
    if (!baseline.ok) {
      throw new Error(
        "Baseline tests failed before any changes. Aborting. If resuming a partial task, re-run with --skip-baseline"
      );
    }
    log("Baseline tests OK");
  }

  for (const task of selected) {
    await runTask(task, opts, logStream);
    await markPlanCheckbox(opts.plan, task.id, opts.model);
  }

  log("All selected tasks completed.");
  await appendLog(logStream, `\n## Finished\n${new Date().toISOString()}\n`);
}

main().catch((err) => {
  console.error("\nERROR:", err.message || err);
  process.exit(1);
});
