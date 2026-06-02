# backend/services/folder_service.py

from sqlalchemy.orm import Session
from db.models import Folder

def create_folder(db: Session, name: str, parent_id: str, owner: str) -> Folder:
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
    folder = get_folder(db, folder_id, owner)
    if not folder:
        return None
    folder.name = new_name
    db.commit()
    db.refresh(folder)
    return folder

def delete_folder(db: Session, folder_id: str, owner: str) -> bool:
    folder = get_folder(db, folder_id, owner)
    if not folder:
        return False
    db.delete(folder)
    db.commit()
    return True