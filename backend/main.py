from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import init_db
from api import auth, files, folders, storage
from config import settings
import uvicorn

@asynccontextmanager
async def lifespan(_app):
    init_db()
    yield

app = FastAPI(title="Locloud", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,    prefix="/api/auth")
app.include_router(files.router,   prefix="/api/files")
app.include_router(folders.router, prefix="/api/folders")
app.include_router(storage.router, prefix="/api/storage")

@app.get("/api/health")
def health():
    return {"status": "ok"}
    
if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT,
                timeout_keep_alive=600,
                loop="asyncio",
                http="httptools")
