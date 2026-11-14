from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from db.database import get_db
from services import file_service
from api.auth import get_current_user
from pydantic import BaseModel, Field

router = APIRouter()

class RenameRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)

class MoveRequest(BaseModel):
    folder_id: str | None = None

@router.get("/")
def list_files(folder_id: str = None, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    return file_service.get_files(db, folder_id, user)

@router.post("/upload/start")
def start_upload(filename: str, folder_id: str = None, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    return file_service.start_chunked_upload(db, filename, folder_id, user)

@router.post("/upload/chunk")
def upload_chunk(file_id: str, chunk_index: int, file: UploadFile = File(...), db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    file_service.save_chunk(db, file_id, chunk_index, file, user)
    return {"ok": True}

@router.post("/upload/finish")
def finish_upload(file_id: str, total_chunks: int, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    return file_service.finish_chunked_upload(db, file_id, total_chunks, user)

@router.post("/upload")
def upload_file(folder_id: str = None, file: UploadFile = File(...), db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    return file_service.save_file(db, file, folder_id, user)

@router.get("/download/{file_id}")
def download_file(file_id: str, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    f = file_service.get_file(db, file_id, user)
    if not f or f.status != "ready":
        raise HTTPException(status_code=404, detail="File not found")
    return file_service.file_response(f)

@router.delete("/{file_id}")
def delete_file(file_id: str, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    if not file_service.delete_file(db, file_id, user):
        raise HTTPException(status_code=404, detail="File not found")
    return {"ok": True}

@router.patch("/{file_id}/rename")
def rename_file(file_id: str, body: RenameRequest, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    f = file_service.rename_file(db, file_id, body.name.strip(), user)
    if not f:
        raise HTTPException(status_code=404, detail="File not found")
    return f

@router.patch("/{file_id}/move")
def move_file(file_id: str, body: MoveRequest, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    moved = file_service.move_file(db, file_id, body.folder_id, user)
    if not moved:
        raise HTTPException(status_code=404, detail="File not found")
    return moved


