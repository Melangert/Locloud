from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from db.database import get_db
from services import file_service
from api.auth import get_current_user
from config import settings
import os

router = APIRouter()

@router.get("/")
def list_files(folder_id: str = None, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    return file_service.get_files(db, folder_id, user)

@router.post("/upload")
def upload_file(folder_id: str = None, file: UploadFile = File(...), db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    return file_service.save_file(db, file, folder_id, user)

@router.get("/download/{file_id}")
def download_file(file_id: str, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    f = file_service.get_file(db, file_id, user)
    if not f:
        raise HTTPException(status_code=404, detail="File not found")
    abs_path = os.path.join(settings.UPLOAD_DIR, f.path)
    if not os.path.exists(abs_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(abs_path, filename=f.name, media_type='application/octet-stream')

@router.delete("/{file_id}")
def delete_file(file_id: str, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    if not file_service.delete_file(db, file_id, user):
        raise HTTPException(status_code=404, detail="File not found")
    return {"ok": True}

@router.patch("/{file_id}/rename")
def rename_file(file_id: str, body: dict, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    f = file_service.rename_file(db, file_id, body["name"], user)
    if not f:
        raise HTTPException(status_code=404, detail="File not found")
    return f