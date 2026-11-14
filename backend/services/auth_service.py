# backend/services/auth_service.py

from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from config import settings
from db.database import SessionLocal
from db.models import Credential

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# v1: single user, loaded from .env
FAKE_USER = {
    "username": "admin",
    "password": settings.PASSWORD_HASH
}

def credentials():
    with SessionLocal() as db:
        record = db.get(Credential, "admin")
        return (record.password_hash, record.version) if record else (settings.PASSWORD_HASH, "initial")

def verify_password(plain: str, hashed: str) -> bool:
    return bool(hashed) and pwd_context.verify(plain, hashed)

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def create_token(username: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": username, "exp": expire, "version": credentials()[1]},
        settings.JWT_SECRET,
        algorithm="HS256"
    )

def decode_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        subject = payload.get("sub")
        if payload.get("version", "initial") != credentials()[1]:
            return None
        return subject if subject == "admin" else None
    except JWTError:
        return None
