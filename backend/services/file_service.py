import shutil
import os
from sqlalchemy.orm import Session
from db.models import File
from config import settings
from fastapi import UploadFile
import uuid

def save_file(db: Session, file: UploadFile, folder_id: str, owner: str) -> File:
    print("saving file...")
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    relative_path = f"{owner}/{file_id}{ext}"
    abs_path = os.path.join(settings.UPLOAD_DIR, relative_path)

    os.makedirs(os.path.dirname(abs_path), exist_ok=True)

    with open(abs_path, "wb") as f:
        while chunk := file.file.read(64 * 1024):
           f.write(chunk)

    size = os.path.getsize(abs_path)

    db_file = File(
        id=file_id,
        name=file.filename,
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
        File.folder_id == folder_id
    ).all()

def get_file(db: Session, file_id: str, owner: str) -> File:
    return db.query(File).filter(
        File.id == file_id,
        File.owner == owner
    ).first()

def delete_file(db: Session, file_id: str, owner: str) -> bool:
    file = get_file(db, file_id, owner)
    if not file:
        return False

    abs_path = os.path.join(settings.UPLOAD_DIR, file.path)
    if os.path.exists(abs_path):
        os.remove(abs_path)

    db.delete(file)
    db.commit()
    return True

def rename_file(db: Session, file_id: str, new_name: str, owner: str) -> File:
    file = get_file(db, file_id, owner)
    if not file:
        return None

    file.name = new_name
    db.commit()
    db.refresh(file)
    return file

CHUNK_DIR = os.path.join(settings.UPLOAD_DIR, "_chunks")

def start_chunked_upload(db: Session, filename: str, folder_id: str, owner: str):
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(filename)[1]
    relative_path = f"{owner}/{file_id}{ext}"
    db_file = File(
        id=file_id,
        name=filename,
        path=relative_path,
        size=0,
        folder_id=folder_id or None,
        owner=owner
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file

def save_chunk(file_id: str, chunk_index: int, file: UploadFile, owner: str):
    chunk_dir = os.path.join(CHUNK_DIR, file_id)
    os.makedirs(chunk_dir, exist_ok=True)
    chunk_path = os.path.join(chunk_dir, str(chunk_index))
    with open(chunk_path, "wb") as f:
        while chunk := file.file.read(32 * 1024):
            f.write(chunk)

def finish_chunked_upload(db: Session, file_id: str, total_chunks: int, owner: str):
    db_file = db.query(File).filter(File.id == file_id, File.owner == owner).first()
    if not db_file:
        raise Exception("File not found")
    abs_path = os.path.join(settings.UPLOAD_DIR, db_file.path)
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
    with open(abs_path, "wb") as out:
        for i in range(total_chunks):
            chunk_path = os.path.join(CHUNK_DIR, file_id, str(i))
            with open(chunk_path, "rb") as c:
                shutil.copyfileobj(c, out)
    shutil.rmtree(os.path.join(CHUNK_DIR, file_id))
    db_file.size = os.path.getsize(abs_path)
    db.commit()
    db.refresh(db_file)
    return db_file
