from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from services import folder_service
from api.auth import get_current_user
from pydantic import BaseModel, Field

router = APIRouter()

class FolderRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    parent_id: str | None = None

@router.get("/")
def list_folders(parent_id: str = None, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    return folder_service.get_folders(db, parent_id, user)

@router.post("/")
def create_folder(body: FolderRequest, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    return folder_service.create_folder(db, body.name.strip(), body.parent_id, user)

@router.patch("/{folder_id}/rename")
def rename_folder(folder_id: str, body: FolderRequest, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    f = folder_service.rename_folder(db, folder_id, body.name.strip(), user)
    if not f:
        raise HTTPException(status_code=404, detail="Folder not found")
    return f

@router.delete("/{folder_id}")
def delete_folder(folder_id: str, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    if not folder_service.delete_folder(db, folder_id, user):
        raise HTTPException(status_code=404, detail="Folder not found")
    return {"ok": True}
