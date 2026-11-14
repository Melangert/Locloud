

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from services.auth_service import verify_password, create_token, decode_token, credentials, hash_password
from pydantic import BaseModel, Field
from db.database import get_db
from db.models import Credential
from sqlalchemy.orm import Session
import secrets

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends()):
    if form.username != "admin":
        raise HTTPException(status_code=401, detail="Invalid credentials")
    try:
        valid_password = verify_password(form.password, credentials()[0])
    except ValueError:
        valid_password = False
    if not valid_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {
        "access_token": create_token(form.username),
        "token_type": "bearer"
    }

def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    username = decode_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return username

@router.get("/me")
def me(username: str = Depends(get_current_user)):
    return {"username": username}

class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=72)
    new_password: str = Field(min_length=12, max_length=72)

@router.post("/password")
def change_password(body: PasswordChange, username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    if len(body.new_password.encode()) > 72:
        raise HTTPException(status_code=400, detail="Password must be at most 72 UTF-8 bytes")
    try:
        valid = verify_password(body.current_password, credentials()[0])
    except ValueError:
        valid = False
    if not valid:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if body.current_password == body.new_password:
        raise HTTPException(status_code=400, detail="Choose a different new password")
    record = db.get(Credential, username)
    if not record:
        record = Credential(username=username)
        db.add(record)
    record.password_hash = hash_password(body.new_password)
    record.version = secrets.token_hex(16)
    db.commit()
    return {"access_token": create_token(username), "token_type": "bearer"}
