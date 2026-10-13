# TenderLens AI Service Local Development Runner (PowerShell)
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$aiDir = Join-Path $scriptDir "..\ai-service"

Set-Location $aiDir

# Pick python command
$py = "python"
if (-not (Get-Command $py -ErrorAction SilentlyContinue)) {
    $py = "py"
}

# Create venv if missing
if (-not (Test-Path ".venv")) {
    Write-Host "Creating virtual environment with $py..." -ForegroundColor Cyan
    & $py -m venv .venv
}

# Activate virtual environment
$activateScript = ".venv\Scripts\Activate.ps1"
if (Test-Path $activateScript) {
    & $activateScript
}

# Check requirements
Write-Host "Verifying dependencies..." -ForegroundColor Cyan
& python -m pip install --quiet --upgrade pip
& python -m pip install --quiet -r requirements.txt

Write-Host "Starting TenderLens AI Service on http://localhost:8000..." -ForegroundColor Green
& python -m uvicorn app.main:app --reload --port 8000
