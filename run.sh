#!/bin/bash

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ---------------- backend ----------------
cd "$ROOT_DIR/backend"

if [ ! -d "venv" ]; then
  python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

uvicorn main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

cd "$ROOT_DIR/frontend"

# ---------------- frontend ----------------
npm install
npm run dev &
FRONTEND_PID=$!

sleep 3

xdg-open http://localhost:5173

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

wait