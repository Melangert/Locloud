#!/bin/bash
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR/backend"

if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt -q

JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
PASSWORD_HASH=$(python3 -c "from services.auth_service import hash_password; print(hash_password('admin'))")

cat > .env <<EOF
JWT_SECRET=$JWT_SECRET
PASSWORD_HASH=$PASSWORD_HASH
EOF

echo "Setup complete. Default login: admin / admin"