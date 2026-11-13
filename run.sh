#!/bin/bash
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$ROOT_DIR/backend/.env" ]; then
  bash "$ROOT_DIR/setup.sh"
fi

LOCAL_IP=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for (i = 1; i <= NF; i++) if ($i == "src") {print $(i + 1); exit}}')
LOCAL_IP="${LOCAL_IP:-127.0.0.1}"
PIDS=()

# ---------------- backend ----------------
cd "$ROOT_DIR/backend"
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate
if ! python3 -c "import fastapi" >/dev/null 2>&1; then
  pip install -r requirements.txt
fi
if (echo >/dev/tcp/127.0.0.1/8000) 2>/dev/null; then
  echo "Backend already running on port 8000; reusing it."
else
  python3 main.py &
  PIDS+=("$!")
fi

# ---------------- frontend ----------------
cd "$ROOT_DIR/frontend"
if [ ! -d "node_modules" ]; then
  npm install
fi
if (echo >/dev/tcp/127.0.0.1/5173) 2>/dev/null; then
  echo "Frontend already running on port 5173; reusing it."
else
  npm run dev &
  PIDS+=("$!")
fi

sleep 3
echo "Access locloud at: http://$LOCAL_IP:5173"
xdg-open "http://$LOCAL_IP:5173" 2>/dev/null || true

cleanup() {
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT

if [ "${#PIDS[@]}" -gt 0 ]; then
  wait "${PIDS[@]}"
else
  echo "Locloud is already running; press Ctrl+C to exit."
  while true; do sleep 3600; done
fi
