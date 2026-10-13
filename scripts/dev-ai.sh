#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/../ai-service"

# Pick the right python command
if command -v python >/dev/null 2>&1; then
  PY=python
else
  PY=python3
fi

# Create venv if missing
if [ ! -d ".venv" ]; then
  echo "Creating venv with $PY…"
  "$PY" -m venv .venv
fi

# Activate — Windows uses Scripts/, POSIX uses bin/
if [ -f ".venv/Scripts/activate" ]; then
  # shellcheck disable=SC1091
  source .venv/Scripts/activate
elif [ -f ".venv/bin/activate" ]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
else
  echo "ERROR: no activate script found under .venv/" >&2
  exit 1
fi

# Install deps on first run
if ! python -c "import fastapi" 2>/dev/null; then
  echo "Installing requirements…"
  pip install --upgrade pip
  pip install -r requirements.txt
fi

exec uvicorn app.main:app --reload --port 8000
