# AFK plan runner for Qwen via the native Ollama tool-loop
# (scripts/execute-plan-ollama.mjs — tools: read_file / write_file / replace_in_file).
#
# Why not OpenCode by default?
# OpenCode exposes tools as read/edit with camelCase filePath; Qwen 27B often emits
# read_file / file_path and bash&& which break on Windows. The Ollama loop matches
# what this model already knows how to call.
#
# Usage:
#   .\scripts\run-opencode-plan.ps1
#   .\scripts\run-opencode-plan.ps1 -From 1 -To 15
#   .\scripts\run-opencode-plan.ps1 -Task 3
#   .\scripts\run-opencode-plan.ps1 -Plan docs/superpowers/plans/2026-08-21-desktop-clicker-focus.md
#   .\scripts\run-opencode-plan.ps1 -Engine opencode   # legacy / experimental

param(
  [string]$Plan = "docs/superpowers/plans/2026-08-21-desktop-clicker-focus.md",
  [string]$Model = "qwen3.8-agent:27b",
  [ValidateSet("ollama", "opencode")]
  [string]$Engine = "ollama",
  [Nullable[int]]$Task = $null,
  [int]$From = 1,
  [int]$To = 15,
  [switch]$Commit,
  [switch]$SkipBaseline
)

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not (Test-Path $Plan)) {
  Write-Host "Plan not found: $Plan" -ForegroundColor Red
  exit 1
}

$start = if ($null -ne $Task) { [int]$Task } else { $From }
$end = if ($null -ne $Task) { [int]$Task } else { $To }

Write-Host "AFK runner engine=$Engine model=$Model tasks=$start..$end"
Write-Host "Plan: $Plan"
Write-Host "Anda AFK: una Task tras otra sin intervencion."

if ($Engine -eq "ollama") {
  $nodeArgs = @(
    "scripts/execute-plan-ollama.mjs",
    "--plan", $Plan,
    "--model", $Model,
    "--from", "$start",
    "--to", "$end",
    "--no-think"
  )
  if ($Commit) { $nodeArgs += "--commit" } else { $nodeArgs += "--no-commit" }
  if ($SkipBaseline) { $nodeArgs += "--skip-baseline" }

  Write-Host "Running: node $($nodeArgs -join ' ')"
  & node @nodeArgs
  exit $LASTEXITCODE
}

# --- Experimental OpenCode path (often fails tool schema with this Qwen) ---
$openModel = if ($Model -match "/") { $Model } else { "ollama/$Model" }
$stamp = Get-Date -Format "yyyy-MM-ddTHH-mm-ss"
$logPath = Join-Path $Root "docs/superpowers/plans/execution-log-opencode-$stamp.md"
"# OpenCode experimental AFK log`n`n- Plan: ``$Plan```n- Model: ``$openModel```n" | Set-Content -Encoding utf8 $logPath

for ($n = $start; $n -le $end; $n++) {
  Write-Host "======== OpenCode Task $n ========" -ForegroundColor Cyan
  $prompt = @"
CRITICAL: Use tools named read, edit, write (NOT read_file). Path arg is filePath camelCase.
Repo ONLY: C:\Users\lauta\zombie-clicker. PowerShell: use ; not &&.
Ejecutá SOLO Task $n del plan $Plan. Locked Decisions. No preguntes. Al final: node tests/logic.test.js
"@
  $outFile = Join-Path $env:TEMP "opencode-task-$n-$stamp.out.txt"
  $errFile = Join-Path $env:TEMP "opencode-task-$n-$stamp.err.txt"
  $exe = (Get-Command opencode).Source
  $exeCandidate = Join-Path (Split-Path $exe -Parent) "node_modules\opencode-ai\bin\opencode.exe"
  if (Test-Path $exeCandidate) { $exe = $exeCandidate }
  $p = Start-Process -FilePath $exe -ArgumentList @("run","-m",$openModel,"--auto","--title","desktop-clicker-task-$n",$prompt) `
    -WorkingDirectory $Root -NoNewWindow -Wait -PassThru -RedirectStandardOutput $outFile -RedirectStandardError $errFile
  if ($p.ExitCode -ne 0) { exit $p.ExitCode }
  if ($n -eq 1) {
    $html = Get-Content -Raw "index.html"
    if ($html -notmatch 'id="hero-brains"') {
      Write-Host "Task 1 missing #hero-brains - abort" -ForegroundColor Red
      exit 2
    }
  }
}
exit 0
