#!/usr/bin/env bash

set -euo pipefail

function kill_if_running() {
  local pattern="$1"

  if pgrep -f "$pattern" >/dev/null 2>&1; then
    pkill -f "$pattern"
    echo "Stopped processes matching: $pattern"
  else
    echo "No processes matching: $pattern"
  fi
}

echo "Shutting down Nightwatch dev stack..."

kill_if_running "npm-run-all --parallel dev:worker dev:app"
kill_if_running "wrangler dev functions/_worker.ts"
kill_if_running "vite --host 127.0.0.1"
kill_if_running "workerd"

echo "Stack shutdown complete."
