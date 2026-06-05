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
        while chunk := file.file.read(32 * 1024):
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
