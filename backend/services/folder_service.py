# backend/services/folder_service.py

from sqlalchemy.orm import Session
from db.models import Folder

def _safe_name(name: str) -> str:
    from fastapi import HTTPException
    value = (name or "").strip()
    if not value:
        raise HTTPException(status_code=400, detail="A folder name is required")
    return value

def create_folder(db: Session, name: str, parent_id: str, owner: str) -> Folder:
    name = _safe_name(name)
    if parent_id and not get_folder(db, parent_id, owner):
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Parent folder not found")
    folder = Folder(
        name=name,
        parent_id=parent_id or None,
        owner=owner
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder

def get_folders(db: Session, parent_id: str, owner: str) -> list[Folder]:
    return db.query(Folder).filter(
        Folder.owner == owner,
        Folder.parent_id == parent_id
    ).all()

def get_folder(db: Session, folder_id: str, owner: str) -> Folder:
    return db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner == owner
    ).first()

def rename_folder(db: Session, folder_id: str, new_name: str, owner: str) -> Folder:
    new_name = _safe_name(new_name)
    folder = get_folder(db, folder_id, owner)
    if not folder:
        return None
    folder.name = new_name
    db.commit()
    db.refresh(folder)
    return folder

from services.file_service import serialized

@serialized
def delete_folder(db: Session, folder_id: str, owner: str) -> bool:
    folder = get_folder(db, folder_id, owner)
    if not folder:
        return False
    from db.models import File
    folders = [folder]
    index = 0
    while index < len(folders):
        children = db.query(Folder).filter(
            Folder.parent_id == folders[index].id,
            Folder.owner == owner
        ).all()
        folders.extend(children)
        index += 1
    folder_ids = [item.id for item in folders]
    files = db.query(File).filter(
        File.owner == owner,
        File.folder_id.in_(folder_ids)
    ).all()
    import os
    from config import settings
    for file in files:
        path = os.path.abspath(os.path.join(settings.UPLOAD_DIR, file.path))
        for disk_path in (path, path + ".assembling"):
            if os.path.isfile(disk_path):
                os.remove(disk_path)
        import shutil
        from services.file_service import CHUNK_DIR
        shutil.rmtree(os.path.join(CHUNK_DIR, file.id), ignore_errors=True)
        db.delete(file)
    for item in reversed(folders):
        db.delete(item)
    db.commit()
    return True