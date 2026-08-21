# Execute Zombie Clicker redesign plan via local Ollama (qwen3.8-agent:27b)
# Usage:
#   .\scripts\execute-redesign-ollama.ps1
#   .\scripts\execute-redesign-ollama.ps1 -Task 1
#   .\scripts\execute-redesign-ollama.ps1 -From 1 -To 3
#   .\scripts\execute-redesign-ollama.ps1 -List
#   .\scripts\execute-redesign-ollama.ps1 -Commit

param(
  [string]$Model = "qwen3.8-agent:27b",
  [string]$HostUrl = "http://127.0.0.1:11434",
  [Nullable[int]]$Task = $null,
  [Nullable[int]]$From = $null,
  [Nullable[int]]$To = $null,
  [switch]$List,
  [switch]$Commit,
  [switch]$Think,
  [int]$MaxIters = 30,
  [int]$NumCtx = 32768
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "Checking Ollama at $HostUrl ..."
try {
  $null = Invoke-RestMethod -Uri "$HostUrl/api/tags" -Method Get
} catch {
  Write-Error "Ollama is not reachable at $HostUrl. Start it with: ollama serve"
  exit 1
}

$argsList = @(
  "scripts/execute-plan-ollama.mjs",
  "--model", $Model,
  "--host", $HostUrl,
  "--max-iters", "$MaxIters",
  "--num-ctx", "$NumCtx"
)

if ($List) { $argsList += "--list" }
if ($Commit) { $argsList += "--commit" } else { $argsList += "--no-commit" }
if ($Think) { $argsList += "--think" } else { $argsList += "--no-think" }
if ($null -ne $Task) { $argsList += @("--task", "$Task") }
if ($null -ne $From) { $argsList += @("--from", "$From") }
if ($null -ne $To) { $argsList += @("--to", "$To") }

Write-Host "Running: node $($argsList -join ' ')"
node @argsList
exit $LASTEXITCODE
