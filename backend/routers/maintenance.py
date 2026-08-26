from fastapi import APIRouter, HTTPException
from database import get_db
from models import MaintenanceTaskCreate
from optimizer import calculate_ai_risk_score, calculate_task_duration_adjusted

router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])

# Valid sort_by columns whitelist (prevents SQL injection)
_VALID_SORT_COLS = {
    "ai_risk_score", "overdue_days", "criticality",
    "urgency", "safety_risk", "required_duration_mins", "created_at",
}


def _compute_priority(criticality, urgency, safety_risk, overdue_days, train_impact, speed_impact_kmh=0, weather_risk=0):
    ov  = min(10.0, (overdue_days    / 6.0)  * 10.0)
    spd = min(10.0, (speed_impact_kmh / 30.0) * 10.0)
    raw = (0.35 * criticality + 0.25 * urgency + 0.20 * safety_risk
           + 0.10 * ov + 0.10 * spd - 0.05 * weather_risk)
    return round(min(100.0, max(0.0, raw * 10.0)), 1)


@router.get("/unified-defects")
def get_unified_defects(
    department: str = None,
    corridor_id: int = None,
    min_risk_score: float = None,
    status: str = None,
    sort_by: str = "ai_risk_score",
):
    """
    Unified Defect Ingest endpoint returning aggregated defects across TMS, SMMS, and TDMS.

    AI Risk Scores (Layer 1) are attached to every record.
    Night-shift / monsoon-adjusted durations are injected as `duration_adjusted_mins`.

    Query params:
      department:     Filter by 'Engineering' | 'S&T' | 'Traction' | 'All'
      corridor_id:    Filter to a specific corridor ID
      min_risk_score: Only return defects with ai_risk_score >= value
      status:         Filter by 'Pending' | 'In Progress' | 'Completed'
      sort_by:        Column to sort by (default: ai_risk_score)
    """
    db = get_db()
    try:
        # Sanitise sort_by against whitelist
        sort_col = sort_by if sort_by in _VALID_SORT_COLS else "ai_risk_score"

        query = """
            SELECT u.*, c.code as corridor_code, c.name as corridor_name
            FROM unified_defects u
            LEFT JOIN corridors c ON u.corridor_id = c.id
            WHERE 1=1
        """
        params = []

        if department and department not in ("All", "all"):
            query += " AND u.department=?"
            params.append(department)
        if corridor_id:
            query += " AND u.corridor_id=?"
            params.append(corridor_id)
        if min_risk_score is not None:
            query += " AND u.ai_risk_score >= ?"
            params.append(min_risk_score)
        if status and status not in ("All", "all"):
            query += " AND u.status=?"
            params.append(status)

        query += f" ORDER BY u.{sort_col} DESC"

        rows = db.execute(query, params).fetchall()
        result = []
        for r in rows:
            d = dict(r)
            # Re-compute AI risk score if not set (e.g. records created before AI engine upgrade)
            if not d.get("ai_risk_score"):
                d["ai_risk_score"] = calculate_ai_risk_score(d)
            # Inject shift/monsoon adjusted duration (default to 2 AM maintenance window)
            d["duration_adjusted_mins"] = calculate_task_duration_adjusted(
                d.get("required_duration_mins", 60.0),
                scheduled_start_hour=2,
            )
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
        if department and department not in ("All", "all"):
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

        # Also insert into unified_defects for cross-system visibility
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
