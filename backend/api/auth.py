

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from services.auth_service import verify_password, create_token, decode_token, FAKE_USER

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends()):
    if form.username != FAKE_USER["username"]:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(form.password, FAKE_USER["password"]):
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