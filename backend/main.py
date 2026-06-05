from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import init_db
from api import auth, files, folders, storage
import uvicorn

app = FastAPI(title="Locloud")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,    prefix="/api/auth")
app.include_router(files.router,   prefix="/api/files")
app.include_router(folders.router, prefix="/api/folders")
app.include_router(storage.router, prefix="/api/storage")

@app.on_event("startup")
def startup():
    init_db()

@app.get("/api/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, timeout_keep_alive=600, h11_max_incomplete_event_size=10_000_000_000)
