from fastapi import APIRouter
from database import get_db

router = APIRouter(prefix="/api", tags=["data"])


@router.get("/assets")
def get_assets():
    db = get_db()
    try:
        rows = db.execute("""
            SELECT a.*, c.code as corridor_code, c.name as corridor_name
            FROM assets a
            LEFT JOIN corridors c ON a.corridor_id = c.id
        """).fetchall()
        return [dict(r) for r in rows]
    finally:
        db.close()


@router.get("/trains")
def get_trains():
    db = get_db()
    try:
        rows = db.execute("""
            SELECT t.*, c.code as corridor_code, c.name as corridor_name
            FROM trains t
            LEFT JOIN corridors c ON t.corridor_id = c.id
        """).fetchall()
        return [dict(r) for r in rows]
    finally:
        db.close()


@router.get("/corridors")
def get_corridors():
    db = get_db()
    try:
        rows = db.execute("SELECT * FROM corridors").fetchall()
        return [dict(r) for r in rows]
    finally:
        db.close()
