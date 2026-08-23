from fastapi import APIRouter
from database import get_db
from models import OptimizeRequest
from optimizer import optimize_blocks
import datetime

router = APIRouter(prefix="/api", tags=["blocks"])


@router.get("/blocks")
def get_blocks(status: str = None, corridor_id: int = None):
    db = get_db()
    try:
        query = """
            SELECT b.*, c.code as corridor_code, c.name as corridor_name
            FROM blocks b
            LEFT JOIN corridors c ON b.corridor_id = c.id
            WHERE 1=1
        """
        params = []
        if status:
            query += " AND b.status=?"
            params.append(status)
        if corridor_id:
            query += " AND b.corridor_id=?"
            params.append(corridor_id)
        query += " ORDER BY b.created_at DESC"
        rows = db.execute(query, params).fetchall()
        return [dict(r) for r in rows]
    finally:
        db.close()


@router.post("/block/optimize")
def optimize(req: OptimizeRequest):
    db = get_db()
    try:
        tasks = [dict(r) for r in db.execute("SELECT * FROM maintenance_tasks").fetchall()]
        trains = [dict(r) for r in db.execute("SELECT * FROM trains").fetchall()]
        corridors = [dict(r) for r in db.execute("SELECT * FROM corridors").fetchall()]

        result = optimize_blocks(
            tasks=tasks,
            trains=trains,
            corridors=corridors,
            target_date=req.target_date,
            corridor_id=req.corridor_id,
            time_window_start=req.time_window_start,
            time_window_end=req.time_window_end,
            task_ids=req.task_ids,
        )
        return result
    finally:
        db.close()


@router.post("/blocks/{block_id}/approve")
def approve_block(block_id: int):
    db = get_db()
    try:
        db.execute("UPDATE blocks SET status='Approved' WHERE id=?", (block_id,))
        db.commit()
        row = db.execute("SELECT * FROM blocks WHERE id=?", (block_id,)).fetchone()
        return {"success": True, "block": dict(row)}
    finally:
        db.close()


@router.post("/block/save")
def save_block(data: dict):
    """Save an AI-generated optimization result as a block record."""
    db = get_db()
    try:
        count = db.execute("SELECT COUNT(*) FROM blocks").fetchone()[0]
        block_code = f"BLK{count + 1:03d}"
        corridor_row = db.execute(
            "SELECT id FROM corridors WHERE code=?", (data.get("corridor_code", "C1"),)
        ).fetchone()
        corridor_id = corridor_row["id"] if corridor_row else 1
        task_ids_str = ",".join(str(t["id"]) for t in data.get("tasks", []))
        depts_str = ",".join(data.get("departments", []))

        db.execute(
            """INSERT INTO blocks (block_code,corridor_id,start_time,end_time,duration_hours,
               departments,task_ids,priority_score,train_conflicts,estimated_delay_min,
               block_utilization,status,ai_generated,reason)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                block_code, corridor_id,
                data.get("start_time"), data.get("end_time"),
                data.get("duration_hours", 2.0),
                depts_str, task_ids_str,
                data.get("priority_score", 0),
                data.get("train_conflicts", 0),
                data.get("estimated_delay_min", 0),
                data.get("block_utilization", 0),
                "Proposed", 1,
                "; ".join(data.get("explanation", []))[:500],
            ),
        )
        db.commit()
        return {"success": True, "block_code": block_code}
    finally:
        db.close()
