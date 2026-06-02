from sqlalchemy.orm import Session 
from db.models import File

def get_usage(db: Session, owner: str) -> dict:
    total_bytes = db.query(File).filter(
        File.owner == owner
    ).with_entities(File.size).all()

    used = sum(f.size for f in total_bytes)

    return {
        "used": used,
        "used_gb": round(used / (1024 ** 3), 2)
    }

