# Locloud

Locloud is a local-first cloud drive for lightweight devices. It provides a
FastAPI/SQLite backend and a responsive React interface for storing, organizing,
and downloading files on your own hardware.

## Features

- Chunked uploads with progress reporting
- Download, rename, and delete files
- Drag files onto folders to move them
- Nested folders with recursive cleanup
- Storage usage reporting
- Search, breadcrumbs, responsive layout, and list/grid controls
- Settings for theme and compact file-list preferences
- Safer authenticated file and folder operations

## Quick start

Requirements:

- Python 3.10+
- Node.js 18+
- npm

From a clone or extracted release:

```bash
git clone https://github.com/Melangert/Locloud.git
cd Locloud
chmod +x run.sh
./run.sh
```

The script creates the backend environment on first run, installs dependencies
only when needed, starts FastAPI on port `8000`, and starts Vite on port
`5173`. Open <http://localhost:5173>. If Locloud is already running, `run.sh`
reuses the existing services instead of starting duplicates.

The setup script creates a development account:

```text
username: admin
password: admin
```

Change the generated credentials and keep `backend/.env` private before using
Locloud outside a trusted network.

## Release archive

Download the latest `locloud.tar.gz` from the repository Releases page, then:

```bash
tar -xzf locloud.tar.gz
cd Locloud
./run.sh
```

Verify an archive with:

```bash
sha256sum locloud.tar.gz
```

## Development

Backend checks:

```bash
cd backend
python3 -m compileall -q .
```

Frontend checks:

```bash
cd frontend
npm install
npm run lint
npm run build
```

## Security notes

Locloud is designed for local or trusted-network use. Do not expose it directly
to the public internet without adding TLS, stronger account management, and
network access controls.

## Credits

Built with FastAPI, SQLAlchemy, SQLite, React, Vite, and Lucide icons.
