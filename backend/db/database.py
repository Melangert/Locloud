from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from db.models import Base
from config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

def init_db():
    Base.metadata.create_all(bind=engine)
    if "status" not in {column["name"] for column in inspect(engine).get_columns("files")}:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE files ADD COLUMN status VARCHAR NOT NULL DEFAULT 'ready'"))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
