from sqlalchemy.orm import Session 
from db.models import File
from config import settings
import os
import shutil

def get_usage(db: Session, owner: str) -> dict:
    total_bytes = db.query(File).filter(
        File.owner == owner, File.status == "ready"
    ).with_entities(File.size).all()

    used = sum(f.size for f in total_bytes)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    disk = shutil.disk_usage(settings.UPLOAD_DIR)

    return {
        "used": used,
        "used_gb": round(used / (1024 ** 3), 2),
        "disk_total": disk.total,
        "disk_used": disk.used,
        "disk_free": disk.free,
        "file_count": len(total_bytes),
        "upload_path": os.path.abspath(settings.UPLOAD_DIR),
    }

