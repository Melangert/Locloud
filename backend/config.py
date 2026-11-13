from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./locloud.db"
    UPLOAD_DIR: str = "./uploads"
    JWT_SECRET: str = ""
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    PASSWORD_HASH: str = ""
    CORS_ORIGINS: str = "http://localhost:5173"

    class Config:
        env_file = ".env"

settings = Settings()

if not settings.JWT_SECRET:
    raise RuntimeError("JWT_SECRET must be set in backend/.env")