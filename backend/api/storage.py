from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session 
from db.database import get_db
from services import storage_service
from api.auth import get_current_user

router = APIRouter()

@router.get("/usage")
def get_storage_usage(db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    return storage_service.get_usage(db, user)

