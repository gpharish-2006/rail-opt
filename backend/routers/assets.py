from fastapi import APIRouter, HTTPException
from database import get_db
from models import UnifiedDefect
from optimizer import calculate_ai_risk_score, calculate_task_duration_adjusted

router = APIRouter(prefix="/api", tags=["data"])


@router.get("/train-schedules")
def get_train_schedules(
    corridor_id: int = None,
    train_type: str = None,
    min_priority: float = None,
):
    """
    COA (Control Office Application) Train Timetable endpoint.
    Returns scheduled passenger, express, and freight train data.

    Query params:
      corridor_id:  Filter to a specific corridor
      train_type:   Filter by type (e.g. 'Vande Bharat', 'Rajdhani', 'Goods/Freight')
      min_priority: Only return trains with priority_score >= value
    """
    db = get_db()
    try:
        query = """
            SELECT ts.*, c.code as corridor_code, c.name as corridor_name
            FROM train_schedules ts
            LEFT JOIN corridors c ON ts.corridor_id = c.id
            WHERE 1=1
        """
        params = []
        if corridor_id:
            query += " AND ts.corridor_id=?"
            params.append(corridor_id)
        if train_type:
            query += " AND ts.train_type=?"
            params.append(train_type)
        if min_priority is not None:
            query += " AND ts.priority_score>=?"
            params.append(min_priority)
        query += " ORDER BY ts.priority_score DESC, ts.departure_time ASC"
        rows = db.execute(query, params).fetchall()
        return {
            "success": True,
            "total": len(rows),
            "trains": [dict(r) for r in rows],
        }
    finally:
        db.close()


@router.post("/unified-defects")
def ingest_unified_defect(defect: UnifiedDefect):
    """
    Ingest a new multi-department defect log into the unified system.

    Accepts defects from TMS (Engineering), SMMS (S&T), or TDMS (Traction).
    AI Risk Score is automatically computed and attached.
    """
    db = get_db()
    try:
        # Generate task code if not present
        dept_prefix = {
            "Engineering": "TMS",
            "S&T": "SMMS",
            "Traction": "TDMS",
        }.get(defect.department, "DEF")
        count = db.execute("SELECT COUNT(*) FROM unified_defects").fetchone()[0]
        task_code = defect.task_code or f"{dept_prefix}-{count + 1:04d}"

        # Calculate AI risk score
        risk_input = {
            "criticality": defect.criticality,
            "safety_risk": defect.safety_risk,
            "overdue_days": defect.overdue_days,
            "speed_impact_kmh": defect.speed_impact_kmh,
            "weather_risk": defect.weather_risk,
            "corridor_id": defect.corridor_id,
        }
        ai_score = calculate_ai_risk_score(risk_input)

        # Calculate duration-adjusted minutes
        adj_duration = calculate_task_duration_adjusted(
            defect.required_duration_mins, scheduled_start_hour=2
        )

        db.execute(
            """INSERT INTO unified_defects
               (task_code, title, description, department, defect_type, gear_or_mast_id,
                corridor_id, km_start, km_end, required_duration_mins, criticality,
                urgency, safety_risk, overdue_days, speed_impact_kmh, weather_risk,
                ai_risk_score, status, scheduled_date, requested_by)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                task_code, defect.title, defect.description, defect.department,
                defect.defect_type, defect.gear_or_mast_id, defect.corridor_id,
                defect.km_start, defect.km_end, defect.required_duration_mins,
                defect.criticality, defect.urgency, defect.safety_risk,
                defect.overdue_days, defect.speed_impact_kmh, defect.weather_risk,
                ai_score, defect.status, defect.scheduled_date, defect.requested_by,
            ),
        )
        db.commit()

        row = db.execute(
            "SELECT * FROM unified_defects WHERE task_code=?", (task_code,)
        ).fetchone()
        return {
            "success": True,
            "message": f"Defect {task_code} ingested with AI risk score {ai_score}",
            "task_code": task_code,
            "ai_risk_score": ai_score,
            "duration_adjusted_mins": adj_duration,
            "defect": dict(row) if row else None,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        db.close()


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


@router.get("/trains/schedule")
def get_train_schedule(
    corridor_id: int = None,
    section_km_start: float = None,
    section_km_end: float = None,
    time_window_start: str = None,
    time_window_end: str = None,
    train_type: str = None,
):
    """
    COA Train Schedule endpoint for section/time-window filtering.
    Returns scheduled passenger and freight trains for a given section and time window.

    Query params:
      corridor_id:       Filter to a specific corridor
      section_km_start:  Section start KM (filters trains passing through this range)
      section_km_end:    Section end KM
      time_window_start: Start of time window (HH:MM, e.g. '06:00')
      time_window_end:   End of time window (HH:MM, e.g. '18:00')
      train_type:        Filter by type (e.g. 'Vande Bharat', 'Goods/Freight')
    """
    db = get_db()
    try:
        query = """
            SELECT ts.*, c.code as corridor_code, c.name as corridor_name
            FROM train_schedules ts
            LEFT JOIN corridors c ON ts.corridor_id = c.id
            WHERE 1=1
        """
        params = []

        if corridor_id:
            query += " AND ts.corridor_id=?"
            params.append(corridor_id)
        if train_type:
            query += " AND ts.train_type=?"
            params.append(train_type)
        if time_window_start:
            query += " AND ts.departure_time >= ?"
            params.append(time_window_start)
        if time_window_end:
            query += " AND ts.departure_time <= ?"
            params.append(time_window_end)

        query += " ORDER BY ts.priority_score DESC, ts.departure_time ASC"
        rows = db.execute(query, params).fetchall()

        trains = [dict(r) for r in rows]

        # Compute summary statistics
        total = len(trains)
        passenger_count = sum(1 for t in trains if t.get("train_type") != "Goods/Freight")
        freight_count = total - passenger_count
        avg_priority = round(sum(t.get("priority_score", 0) for t in trains) / max(total, 1), 1)

        return {
            "success": True,
            "total": total,
            "passenger_count": passenger_count,
            "freight_count": freight_count,
            "avg_priority_score": avg_priority,
            "section_km_start": section_km_start,
            "section_km_end": section_km_end,
            "trains": trains,
        }
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
