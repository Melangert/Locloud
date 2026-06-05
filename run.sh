#!/bin/bash
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$ROOT_DIR/backend/.env" ]; then
  bash "$ROOT_DIR/setup.sh"
fi

LOCAL_IP=$(hostname -I | awk '{print $1}')

# ---------------- backend ----------------
cd "$ROOT_DIR/backend"
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# ---------------- frontend ----------------
cd "$ROOT_DIR/frontend"
npm install
npm run dev &
FRONTEND_PID=$!

sleep 3
echo "Access locloud at: http://$LOCAL_IP:5173"
xdg-open "http://$LOCAL_IP:5173" 2>/dev/null || true

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
