#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR/backend"
umask 077
mkdir -p uploads
if [[ ! -x venv/bin/python ]]; then python3 -m venv venv; fi
if ! venv/bin/python -c 'import fastapi, uvicorn, sqlalchemy, jose, passlib, bcrypt, pydantic_settings, multipart, httptools' >/dev/null 2>&1; then
  venv/bin/python -m pip install -r requirements.txt
fi
if [[ ! -f .env ]]; then
  venv/bin/python - <<'PY'
from pathlib import Path
from passlib.context import CryptContext
import secrets
secret = secrets.token_hex(32)
password = CryptContext(schemes=['bcrypt']).hash('admin')
Path('.env').write_text(f'JWT_SECRET={secret}\nPASSWORD_HASH={password}\nHOST=0.0.0.0\nPORT=8000\n')
print('Created initial account: admin / admin. Change its password in Settings.')
PY
else
  echo 'Existing configuration and credentials preserved.'
fi
chmod 600 .env
cd "$ROOT_DIR/frontend"
if [[ ! -d node_modules ]]; then npm ci; fi
npm run build
printf 'Setup complete. Start Locloud with: %s/run.sh\n' "$ROOT_DIR"
