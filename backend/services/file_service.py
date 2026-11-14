import shutil
import os
from sqlalchemy.orm import Session
from db.models import File
from config import settings
from fastapi import UploadFile, HTTPException
from fastapi.responses import FileResponse
import uuid
from functools import wraps
from threading import RLock

_upload_lock = RLock()

def serialized(operation):
    @wraps(operation)
    def run(*args, **kwargs):
        with _upload_lock:
            return operation(*args, **kwargs)
    return run

def pending_upload(db, file_id, owner):
    record = get_file(db, file_id, owner)
    if not record or record.status != "uploading":
        raise HTTPException(status_code=404, detail="Upload not found or already completed")
    return record


def _safe_filename(filename: str) -> str:
    name = os.path.basename(filename or "").strip()
    if not name or name in {".", ".."} or len(name) > 255 or any(ord(c) < 32 for c in name):
        raise HTTPException(status_code=400, detail="A valid filename is required")
    return name

def _owned_folder(db: Session, folder_id: str | None, owner: str):
    if not folder_id:
        return None
    from db.models import Folder
    folder = db.query(Folder).filter(Folder.id == folder_id, Folder.owner == owner).first()
    if not folder:
        raise HTTPException(status_code=400, detail="Folder not found")
    return folder.id

def file_response(file: File) -> FileResponse:
    abs_path = os.path.abspath(os.path.join(settings.UPLOAD_DIR, file.path))
    upload_root = os.path.abspath(settings.UPLOAD_DIR)
    if not abs_path.startswith(upload_root + os.sep) or not os.path.isfile(abs_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(abs_path, filename=file.name, media_type="application/octet-stream")

def save_file(db: Session, file: UploadFile, folder_id: str, owner: str) -> File:
    filename = _safe_filename(file.filename)
    folder_id = _owned_folder(db, folder_id, owner)
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(filename)[1]
    relative_path = f"{owner}/{file_id}{ext}"
    abs_path = os.path.join(settings.UPLOAD_DIR, relative_path)

    os.makedirs(os.path.dirname(abs_path), exist_ok=True)

    with open(abs_path, "wb") as f:
        while chunk := file.file.read(64 * 1024):
           f.write(chunk)

    size = os.path.getsize(abs_path)

    db_file = File(
        id=file_id,
        name=filename,
        path=relative_path,
        size=size,
        folder_id=folder_id or None,
        owner=owner
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file

def get_files(db: Session, folder_id: str, owner: str) -> list[File]:
    return db.query(File).filter(
        File.owner == owner,
        File.folder_id == folder_id,
        File.status == "ready"
    ).all()

def get_file(db: Session, file_id: str, owner: str) -> File:
    return db.query(File).filter(
        File.id == file_id,
        File.owner == owner
    ).first()

@serialized
def delete_file(db: Session, file_id: str, owner: str) -> bool:
    file = get_file(db, file_id, owner)
    if not file:
        return False

    abs_path = os.path.join(settings.UPLOAD_DIR, file.path)
    for path in (abs_path, abs_path + ".assembling"):
        if os.path.isfile(path):
            os.remove(path)

    shutil.rmtree(os.path.join(CHUNK_DIR, file_id), ignore_errors=True)
    db.delete(file)
    db.commit()
    return True

def rename_file(db: Session, file_id: str, new_name: str, owner: str) -> File:
    new_name = _safe_filename(new_name)
    file = get_file(db, file_id, owner)
    if not file:
        return None

    file.name = new_name
    db.commit()
    db.refresh(file)
    return file

def move_file(db: Session, file_id: str, folder_id: str | None, owner: str) -> File:
    file = get_file(db, file_id, owner)
    if not file:
        return None
    file.folder_id = _owned_folder(db, folder_id, owner)
    db.commit()
    db.refresh(file)
    return file

CHUNK_DIR = os.path.join(settings.UPLOAD_DIR, "_chunks")

@serialized
def start_chunked_upload(db: Session, filename: str, folder_id: str, owner: str):
    filename = _safe_filename(filename)
    folder_id = _owned_folder(db, folder_id, owner)
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(filename)[1]
    relative_path = f"{owner}/{file_id}{ext}"
    db_file = File(
        id=file_id,
        name=filename,
        path=relative_path,
        size=0,
        folder_id=folder_id or None,
        owner=owner,
        status="uploading"
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file

@serialized
def save_chunk(db: Session, file_id: str, chunk_index: int, file: UploadFile, owner: str):
    if chunk_index < 0:
        raise HTTPException(status_code=400, detail="Invalid chunk index")
    pending_upload(db, file_id, owner)
    chunk_dir = os.path.join(CHUNK_DIR, file_id)
    os.makedirs(chunk_dir, exist_ok=True)
    chunk_path = os.path.join(chunk_dir, str(chunk_index))
    temporary_path = chunk_path + ".partial"
    try:
        with open(temporary_path, "wb") as f:
            size = 0
            while chunk := file.file.read(32 * 1024):
                size += len(chunk)
                if size > 10 * 1024 * 1024:
                    raise HTTPException(status_code=413, detail="Upload chunks must be 10 MiB or smaller")
                if shutil.disk_usage(settings.UPLOAD_DIR).free < len(chunk):
                    raise HTTPException(status_code=507, detail="Storage disk is full")
                f.write(chunk)
        os.replace(temporary_path, chunk_path)
    finally:
        if os.path.exists(temporary_path):
            os.remove(temporary_path)

@serialized
def finish_chunked_upload(db: Session, file_id: str, total_chunks: int, owner: str):
    if total_chunks < 1:
        raise HTTPException(status_code=400, detail="Invalid chunk count")
    db_file = pending_upload(db, file_id, owner)
    chunk_dir = os.path.join(CHUNK_DIR, file_id)
    missing = [str(i) for i in range(total_chunks) if not os.path.isfile(os.path.join(chunk_dir, str(i)))]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing upload chunks: {', '.join(missing[:5])}")
    abs_path = os.path.join(settings.UPLOAD_DIR, db_file.path)
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
    required = sum(os.path.getsize(os.path.join(chunk_dir, str(i))) for i in range(total_chunks))
    if required > shutil.disk_usage(settings.UPLOAD_DIR).free:
        raise HTTPException(status_code=507, detail="Not enough free disk space to finish upload")
    temporary_path = abs_path + ".assembling"
    try:
        with open(temporary_path, "wb") as out:
            for i in range(total_chunks):
                chunk_path = os.path.join(CHUNK_DIR, file_id, str(i))
                with open(chunk_path, "rb") as c:
                    shutil.copyfileobj(c, out)
        os.replace(temporary_path, abs_path)
    finally:
        if os.path.exists(temporary_path):
            os.remove(temporary_path)
    shutil.rmtree(chunk_dir, ignore_errors=True)
    db_file.status = "ready"
    db_file.size = os.path.getsize(abs_path)
    db.commit()
    db.refresh(db_file)
    return db_file
