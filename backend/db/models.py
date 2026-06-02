from sqlalchemy import Column, String, Integer, BigInteger, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

def gen_id():
    return str(uuid.uuid4())

class Folder(Base):
    __tablename__ = "folders"

    id       = Column(String, primary_key=True, default=gen_id)
    name     = Column(String, nullable=False)
    parent_id = Column(String, ForeignKey("folders.id"), nullable=True)
    owner     = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class File(Base):
    __tablename__ = "files"

    id       = Column(String, primary_key=True, default=gen_id)
    name     = Column(String, nullable=False)
    path     = Column(String, nullable=False)
    size     = Column(BigInteger, nullable=False)
    folder_id = Column(String, ForeignKey("folders.id"), nullable=True)
    owner     = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
