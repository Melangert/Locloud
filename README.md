# Locloud

Local file storage with a FastAPI/SQLite backend and React interface.

## Run locally

Requirements: Python 3.10+, Node.js 20.19+ or 22.12+, and npm.

For a new installation:

```bash
mkdir -p ~/Projects
cd ~/Projects
git clone https://github.com/Melangert/Locloud.git
cd Locloud
./setup.sh
./run.sh
```

For an existing installation, stop Locloud, back up its data (see below), then:

```bash
cd ~/Projects/Locloud
git pull --ff-only
./setup.sh
./run.sh
```

Open **http://localhost:8000**. The launcher serves the built interface and API
from one server, checks readiness, and opens your browser. Keep the terminal
open; Ctrl+C stops it. Set `LOCLOUD_OPEN_BROWSER=0` to skip opening a browser.
Run `./setup.sh` again after frontend changes to rebuild the interface.
Existing `.env`, credentials, database, and uploads are preserved by setup.
A Locloud desktop launcher can be installed by copying `locloud.desktop` into
`~/.local/share/applications/` (its path assumes `~/Projects/Locloud`).

The initial account is **admin / admin**. Use **Settings → Change password**
to replace it; the new hash is stored in SQLite and other sessions are revoked.
Existing installations retain their current password.

For another device on your trusted LAN, open `http://<server-LAN-IP>:8000`.
`HOST` and `PORT` in `backend/.env` control the listener; the default host is
`0.0.0.0`. Use `HOST=127.0.0.1` for access from this computer only. Internet
exposure requires a separately configured HTTPS proxy and network controls.

## File workflows

- Upload multiple files sequentially, with progress and cancellation.
- Incomplete uploads stay hidden; cancellation removes their chunks and record.
- Download, rename, permanently delete, or move files to any folder or the root.
- Drag files onto folders to move them; touch devices have visible action buttons.
- Navigate nested folders using the sidebar and named breadcrumbs.
- Switch between working list/grid views, sort by name/date/size, and search the
  current folder. Ctrl/Cmd+K focuses search.
- Real disk usage/free space, separate from Locloud's stored-file total.
- Settings: system/light/dark theme, compact rows, default view, sort order,
  hidden files, preference reset, storage details, and password change.
  Browsing preferences are saved in the current browser.

Deletion is permanent and prompts for confirmation. There is no recycle bin.
If a browser closes or loses connection during an upload, unfinished data can
remain on the server; automatic expiry/resume is not implemented.
Chunk assembly needs enough disk space for both uploaded chunks and the final
file. The supplied launcher runs a single backend process.

## Data and backups

Data lives in `backend/locloud.db`, `backend/uploads/`, and `backend/.env`.
Back up all three together with the server stopped. The database also contains
password changes; keep backups private. Existing databases migrate automatically
on first start, retaining existing file records. Do not commit runtime data.

## Development and checks

```bash
cd ~/Projects/Locloud/backend
venv/bin/python main.py
# In another terminal:
cd ~/Projects/Locloud/frontend
npm run dev
```

Vite is available at port 5173 and proxies `/api` to port 8000.

```bash
cd frontend
npm run lint
npm test
npm run build
cd ../backend
# Install httpx if no compatible test client is installed:
venv/bin/python -m pip install httpx
venv/bin/python -m unittest discover -s tests -v
```

Integration tests use a temporary database and upload directory. They cover
file transfers, empty files, rename/move/delete, nested cleanup, authentication,
ownership, password changes/session revocation, storage reporting, frontend
serving, and migration of an existing database.
