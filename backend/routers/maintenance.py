from fastapi import APIRouter, HTTPException
from database import get_db
from models import MaintenanceTaskCreate
from optimizer import calculate_ai_risk_score

router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])


def _compute_priority(criticality, urgency, safety_risk, overdue_days, train_impact, speed_impact_kmh=0, weather_risk=0):
    ov = min(10.0, (overdue_days / 6.0) * 10.0)
    spd = min(10.0, (speed_impact_kmh / 30.0) * 10.0)
    raw = (0.35 * criticality + 0.25 * urgency + 0.20 * safety_risk + 0.10 * ov + 0.10 * spd - 0.05 * weather_risk)
    return round(min(100.0, max(0.0, raw * 10.0)), 1)


@router.get("/unified-defects")
def get_unified_defects(department: str = None, corridor_id: int = None, min_risk_score: float = None):
    """
    Unified Defect Ingest endpoint returning aggregated defects across TMS, SMMS, and TDMS
    with Layer 1 AI Risk Scores attached.
    """
    db = get_db()
    try:
        query = """
            SELECT u.*, c.code as corridor_code, c.name as corridor_name
            FROM unified_defects u
            LEFT JOIN corridors c ON u.corridor_id = c.id
            WHERE 1=1
        """
        params = []
        if department and department != "All":
            query += " AND u.department=?"
            params.append(department)
        if corridor_id:
            query += " AND u.corridor_id=?"
            params.append(corridor_id)
        if min_risk_score is not None:
            query += " AND u.ai_risk_score >= ?"
            params.append(min_risk_score)
        query += " ORDER BY u.ai_risk_score DESC"

        rows = db.execute(query, params).fetchall()
        result = []
        for r in rows:
            d = dict(r)
            if not d.get("ai_risk_score"):
                d["ai_risk_score"] = calculate_ai_risk_score(d)
            result.append(d)
        return result
    finally:
        db.close()


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
        if department and department != "All":
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
            dept_code = "ENG" if "Eng" in task.department else "SIG" if "S&T" in task.department else "TRD"
            count = db.execute("SELECT COUNT(*) FROM maintenance_tasks").fetchone()[0]
            task.task_code = f"{dept_code}-{count + 101:03d}"

        priority = _compute_priority(
            task.criticality, task.urgency, task.safety_risk,
            task.overdue_days, task.train_impact,
            task.speed_impact_kmh or 0.0, task.weather_risk or 0.0
        )

        db.execute(
            """INSERT INTO maintenance_tasks
               (task_code,title,description,department,asset_id,corridor_id,km_start,km_end,
                duration_hours,criticality,urgency,safety_risk,overdue_days,train_impact,
                speed_impact_kmh,weather_risk,priority_score,status,scheduled_date,requested_by)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                task.task_code, task.title, task.description, task.department,
                task.asset_id, task.corridor_id, task.km_start, task.km_end,
                task.duration_hours, task.criticality, task.urgency, task.safety_risk,
                task.overdue_days, task.train_impact, task.speed_impact_kmh or 0.0,
                task.weather_risk or 0.0, priority, "Pending",
                task.scheduled_date, task.requested_by,
            ),
        )

        # Also insert into unified_defects
        db.execute(
            """INSERT INTO unified_defects
               (task_code,title,description,department,defect_type,gear_or_mast_id,corridor_id,
                km_start,km_end,required_duration_mins,criticality,urgency,safety_risk,
                overdue_days,speed_impact_kmh,weather_risk,ai_risk_score,status,scheduled_date,requested_by)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                task.task_code, task.title, task.description, task.department,
                "Work Order", "DEF-01", task.corridor_id or 1,
                task.km_start or 100.0, task.km_end or 110.0,
                task.duration_hours * 60.0, task.criticality, task.urgency, task.safety_risk,
                task.overdue_days, task.speed_impact_kmh or 0.0, task.weather_risk or 0.0,
                priority, "Pending", task.scheduled_date, task.requested_by
            )
        )
        db.commit()

        row = db.execute(
            "SELECT * FROM maintenance_tasks WHERE task_code=?", (task.task_code,)
        ).fetchone()
        return {"success": True, "task": dict(row)}
    finally:
        db.close()
