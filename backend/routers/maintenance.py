from fastapi import APIRouter, HTTPException
from database import get_db
from models import MaintenanceTaskCreate
import datetime

router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])


def _compute_priority(criticality, urgency, safety_risk, overdue_days, train_impact):
    ov = min(10, overdue_days / 6.0)
    return round(0.35 * criticality + 0.25 * urgency + 0.20 * safety_risk + 0.10 * ov + 0.10 * train_impact, 2)


@router.get("")
def get_maintenance(status: str = None, department: str = None, corridor_id: int = None):
    db = get_db()
    try:
        query = """
            SELECT m.*, a.name as asset_name, c.code as corridor_code, c.name as corridor_name
            FROM maintenance_tasks m
            LEFT JOIN assets a ON m.asset_id = a.id
            LEFT JOIN corridors c ON m.corridor_id = c.id
            WHERE 1=1
        """
        params = []
        if status:
            query += " AND m.status=?"
            params.append(status)
        if department:
            query += " AND m.department=?"
            params.append(department)
        if corridor_id:
            query += " AND m.corridor_id=?"
            params.append(corridor_id)
        query += " ORDER BY m.priority_score DESC"
        rows = db.execute(query, params).fetchall()
        return [dict(r) for r in rows]
    finally:
        db.close()


@router.post("")
def create_maintenance(task: MaintenanceTaskCreate):
    db = get_db()
    try:
        # Auto-generate task code if not provided
        if not task.task_code:
            count = db.execute("SELECT COUNT(*) FROM maintenance_tasks").fetchone()[0]
            task.task_code = f"MT{count + 1:03d}"

        priority = _compute_priority(
            task.criticality, task.urgency, task.safety_risk,
            task.overdue_days, task.train_impact
        )

        db.execute(
            """INSERT INTO maintenance_tasks
               (task_code,title,description,department,asset_id,corridor_id,km_start,km_end,
                duration_hours,criticality,urgency,safety_risk,overdue_days,train_impact,
                priority_score,status,scheduled_date,requested_by)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                task.task_code, task.title, task.description, task.department,
                task.asset_id, task.corridor_id, task.km_start, task.km_end,
                task.duration_hours, task.criticality, task.urgency, task.safety_risk,
                task.overdue_days, task.train_impact, priority, "Pending",
                task.scheduled_date, task.requested_by,
            ),
        )
        db.commit()
        row = db.execute(
            "SELECT * FROM maintenance_tasks WHERE task_code=?", (task.task_code,)
        ).fetchone()
        return {"success": True, "task": dict(row)}
    finally:
        db.close()
