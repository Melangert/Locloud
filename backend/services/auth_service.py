# backend/services/auth_service.py

from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# v1: single user, loaded from .env
FAKE_USER = {
    "username": "admin",
    "password": settings.PASSWORD_HASH
}

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def create_token(username: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": username, "exp": expire},
        settings.JWT_SECRET,
        algorithm="HS256"
    )

def decode_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        return payload.get("sub")
    except JWTError:
        return None