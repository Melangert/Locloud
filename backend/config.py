from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./locloud.db"
    UPLOAD_DIR: str = "./uploads"
    JWT_SECRET: str = "changeme"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    PASSWORD_HASH: str = ""

    class Config:
        env_file = ".env"

settings = Settings()