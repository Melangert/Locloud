# Locloud

Local file storage with a FastAPI and SQLite backend and a React interface.

## Install

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

Open **http://localhost:8000**. The launcher builds the frontend, starts the
backend, checks readiness, and opens your browser. Keep the terminal open; Ctrl+C
stops the server. Set `LOCLOUD_OPEN_BROWSER=0` to skip opening a browser. Run
`./setup.sh` after pulling an update to rebuild the frontend.

Setup preserves an existing `.env`, account, database, and uploaded files. A new
installation starts with `admin` / `admin`; change the password in **Settings**.
Changing it revokes other sessions.

## Upgrade

Stop Locloud and back up `backend/locloud.db`, `backend/uploads/`, and
`backend/.env` together. Then update and restart:

```bash
cd ~/Projects/Locloud
git pull --ff-only
./setup.sh
./run.sh
```

Existing databases migrate automatically on first start. Database migrations
preserve stored file records.

## Use Locloud

- Upload several files with progress and cancellation.
- Browse nested folders, search the current folder, and sort by name, date, or size.
- Move, rename, download, and permanently delete files. Drag files onto folders
  to move them, or use the move action on touch devices.
- Choose list or grid view, light/dark/system theme, compact rows, and whether to
  display hidden files. These preferences are saved in the current browser.
- Review Locloud file usage separately from free space on the storage disk.

Press `/` while the drive is open to focus search. On narrow screens, open the
folder navigation with the menu button. File and folder deletion is permanent;
Locloud does not have a recycle bin.

## Network access and backups

Locloud listens on `0.0.0.0:8000` by default. On another device on your trusted
LAN, open `http://<server-LAN-IP>:8000`. Set `HOST=127.0.0.1` in
`backend/.env` to restrict access to this computer. For internet access, add a
separately configured HTTPS proxy and network controls.

Back up the database, uploads directory, and `.env` together with the server
stopped. The database also contains password changes; keep backups private.
Incomplete uploads can remain on disk if a browser closes or loses connection.
Automatic resume and expiry are not implemented.

## Development

Start the backend and frontend in separate terminals:

```bash
cd ~/Projects/Locloud/backend
venv/bin/python main.py
```

```bash
cd ~/Projects/Locloud/frontend
npm run dev
```

Vite runs on port `5173` and proxies API requests to `127.0.0.1:8000`.

Run frontend checks:

```bash
cd ~/Projects/Locloud/frontend
npm run lint
npm test
npm run build
```

Run backend integration tests:

```bash
cd ~/Projects/Locloud/backend
venv/bin/python -m pip install httpx
venv/bin/python -m unittest discover -s tests -v
```

Backend integration tests use a temporary database and upload directory. They
cover file transfers, cancellation, nested cleanup, ownership, authentication,
password changes, storage reporting, frontend serving, and migration.
