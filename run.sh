#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ ! -f "$ROOT_DIR/backend/.env" || ! -x "$ROOT_DIR/backend/venv/bin/python" || ! -f "$ROOT_DIR/frontend/dist/index.html" ]]; then
  bash "$ROOT_DIR/setup.sh"
fi
cd "$ROOT_DIR/backend"
PORT_VALUE=$(venv/bin/python -c 'from config import settings; print(settings.PORT)')
URL="http://localhost:$PORT_VALUE"
if venv/bin/python - "$URL" <<'PY'
import json, sys, urllib.request
try:
    with urllib.request.urlopen(sys.argv[1] + '/api/health', timeout=2) as response:
        data = json.load(response)
    sys.exit(0 if data.get('app') == 'Locloud' else 1)
except Exception:
    sys.exit(1)
PY
then
  echo "Locloud is already running: $URL"
  if [[ "${LOCLOUD_OPEN_BROWSER:-1}" == 1 ]]; then xdg-open "$URL" >/dev/null 2>&1 || true; fi
  exit 0
fi
printf 'Starting Locloud at %s\nKeep this terminal open; Ctrl+C stops the server.\n' "$URL"
venv/bin/python main.py &
SERVER_PID=$!
cleanup() { kill "$SERVER_PID" 2>/dev/null || true; }
trap cleanup EXIT
trap 'exit 130' INT TERM
for attempt in {1..30}; do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then wait "$SERVER_PID"; exit 1; fi
  if venv/bin/python - "$URL" <<'PY'
import json, sys, urllib.request
try:
    with urllib.request.urlopen(sys.argv[1] + '/api/health', timeout=1) as response:
        sys.exit(0 if json.load(response).get('app') == 'Locloud' else 1)
except Exception:
    sys.exit(1)
PY
  then
    echo "Locloud is ready: $URL"
    if [[ "${LOCLOUD_OPEN_BROWSER:-1}" == 1 ]]; then xdg-open "$URL" >/dev/null 2>&1 || true; fi
    wait "$SERVER_PID"
    exit $?
  fi
  sleep 1
done
echo 'Locloud did not become ready. Check the server output above.' >&2
exit 1
