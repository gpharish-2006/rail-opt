from fastapi import APIRouter, HTTPException
from database import get_db
from models import (
    BlockRecommendation,
    MegaBlocksResponse,
    OptimizeRequest,
    OptimizerPlanRequest,
    OptimizerPlanResponse,
    RescheduleRequest,
)
from optimizer import optimize_blocks, solve_block_schedule, solve_reschedule
import datetime

router = APIRouter(prefix="/api", tags=["blocks"])


@router.get("/blocks", response_model=list[dict])
def get_blocks(status: str = None, corridor_id: int = None) -> list[dict]:
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


@router.post("/block/optimize", response_model=BlockRecommendation | dict)
def optimize(req: OptimizeRequest) -> dict:
    db = get_db()
    try:
        defects_query = "SELECT * FROM unified_defects WHERE 1=1"
        defects_params = []
        if req.corridor_id:
            defects_query += " AND corridor_id=?"
            defects_params.append(req.corridor_id)

        defects = [dict(r) for r in db.execute(defects_query, defects_params).fetchall()]
        if not defects:
            defects = [dict(r) for r in db.execute("SELECT * FROM maintenance_tasks").fetchall()]

        trains_query = "SELECT * FROM train_schedules WHERE 1=1"
        trains_params = []
        if req.corridor_id:
            trains_query += " AND corridor_id=?"
            trains_params.append(req.corridor_id)
        trains = [dict(r) for r in db.execute(trains_query, trains_params).fetchall()]
        if not trains:
            trains = [dict(r) for r in db.execute("SELECT * FROM trains").fetchall()]

        corridors = [dict(r) for r in db.execute("SELECT * FROM corridors").fetchall()]

        res = solve_block_schedule(
            defects=defects,
            train_schedules=trains,
            corridors=corridors,
            horizon="24h",
            max_simultaneous_blocks=req.max_simultaneous_blocks or 3,
            target_date=req.target_date,
            corridor_id=req.corridor_id,
        )
        return res.get("recommendation", {})
    finally:
        db.close()


@router.post("/optimizer/generate-plan", response_model=OptimizerPlanResponse)
def generate_plan(req: OptimizerPlanRequest) -> dict:
    """
    Triggers Google OR-Tools CP-SAT Solver for a specified horizon and corridor.

    Args:
        horizon:  '24h' | 'weekly' | 'monthly'
        corridor_id: Optional corridor filter

    Returns:
        mega_blocks_created, total_hours_saved, schedule_timeline_json, and full solver result.
    """
    db = get_db()
    try:
        defects_query = "SELECT * FROM unified_defects WHERE status != 'Completed'"
        defects_params = []
        if req.corridor_id:
            defects_query += " AND corridor_id=?"
            defects_params.append(req.corridor_id)
        defects_query += " ORDER BY ai_risk_score DESC"

        defects = [dict(r) for r in db.execute(defects_query, defects_params).fetchall()]
        if not defects:
            defects = [dict(r) for r in db.execute("SELECT * FROM maintenance_tasks").fetchall()]

        trains_query = "SELECT * FROM train_schedules WHERE 1=1"
        trains_params = []
        if req.corridor_id:
            trains_query += " AND corridor_id=?"
            trains_params.append(req.corridor_id)
        trains = [dict(r) for r in db.execute(trains_query, trains_params).fetchall()]
        if not trains:
            trains = [dict(r) for r in db.execute("SELECT * FROM trains").fetchall()]

        corridors = [dict(r) for r in db.execute("SELECT * FROM corridors").fetchall()]

        res = solve_block_schedule(
            defects=defects,
            train_schedules=trains,
            corridors=corridors,
            horizon=req.horizon,
            max_simultaneous_blocks=req.max_simultaneous_blocks,
            target_date=req.target_date,
            corridor_id=req.corridor_id,
        )
        return res
    finally:
        db.close()


@router.post("/optimizer/reschedule", response_model=dict)
def reschedule(req: RescheduleRequest) -> dict:
    """
    Event-driven rescheduling when a train is delayed.

    Accepts: train_id (int), delay_minutes (float), and optional section_id.
    Returns: Re-optimised schedule with updated maintenance block windows.
    """
    db = get_db()
    try:
        delayed_train = db.execute(
            "SELECT * FROM train_schedules WHERE id=? OR train_no=?",
            (req.train_id, str(req.train_id)),
        ).fetchone()
        if delayed_train is None:
            raise HTTPException(status_code=404, detail=f"Train {req.train_id} was not found")

        corridor_id = req.corridor_id
        if req.section_id:
            section = db.execute(
                "SELECT id FROM corridors WHERE code=? OR section=? OR from_station=?",
                (req.section_id, req.section_id, req.section_id.split("_")[1] if req.section_id.startswith("SEC_") else req.section_id),
            ).fetchone()
            if section is None:
                raise HTTPException(status_code=404, detail=f"Section {req.section_id} was not found")
            corridor_id = section["id"]

        defects_query = "SELECT * FROM unified_defects WHERE status != 'Completed'"
        defects_params = []
        if corridor_id:
            defects_query += " AND corridor_id=?"
            defects_params.append(corridor_id)

        defects = [dict(r) for r in db.execute(defects_query, defects_params).fetchall()]
        if not defects:
            defects = [dict(r) for r in db.execute("SELECT * FROM maintenance_tasks").fetchall()]

        trains = [dict(r) for r in db.execute("SELECT * FROM train_schedules").fetchall()]
        if not trains:
            trains = [dict(r) for r in db.execute("SELECT * FROM trains").fetchall()]

        corridors = [dict(r) for r in db.execute("SELECT * FROM corridors").fetchall()]

        res = solve_reschedule(
            train_id=delayed_train["id"],
            delay_mins=req.delay_mins,
            defects=defects,
            train_schedules=trains,
            corridors=corridors,
        )

        # Replace only plans on the affected corridor with the solver's conflict-free result.
        if corridor_id and res.get("success") and res.get("schedule_json") is not None:
            db.execute("DELETE FROM block_plans WHERE corridor_id=?", (corridor_id,))
            for index, item in enumerate(res["schedule_json"], start=1):
                if item.get("corridor_id") != corridor_id:
                    continue
                db.execute(
                    """INSERT INTO block_plans (
                        block_code, corridor_id, start_time, end_time, duration_hours,
                        is_mega_block, merged_departments, assigned_tasks,
                        priority_score, train_conflicts, estimated_delay_min,
                        calculated_downtime_saved_mins, block_utilization, status, reason
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        f"RS-{req.train_id}-{index}", corridor_id,
                        item["start_time"], item["end_time"], item["duration_hours"],
                        int(res.get("mega_blocks_created", 0) > 0),
                        item.get("department", "Engineering"), str(item.get("task_code", "")),
                        item.get("priority_score", 0), 0, 0,
                        res.get("total_hours_saved", 0) * 60, 0, "Proposed",
                        "Dynamic train-delay reschedule",
                    ),
                )
            db.commit()
        return res
    finally:
        db.close()


@router.get("/optimizer/status", response_model=dict)
def optimizer_status() -> dict:
    """
    Lightweight status endpoint: returns solver metadata, DB record counts,
    and last optimization summary from block_plans.
    """
    db = get_db()
    try:
        from ortools.sat.python import cp_model
        solver = cp_model.CpSolver()

        defect_count  = db.execute("SELECT COUNT(*) FROM unified_defects").fetchone()[0]
        train_count   = db.execute("SELECT COUNT(*) FROM train_schedules").fetchone()[0]
        block_count   = db.execute("SELECT COUNT(*) FROM block_plans").fetchone()[0]
        approved_count = db.execute("SELECT COUNT(*) FROM block_plans WHERE status='Approved'").fetchone()[0]
        pending_count = db.execute("SELECT COUNT(*) FROM unified_defects WHERE status='Pending'").fetchone()[0]

        return {
            "solver_engine":     "Google OR-Tools CP-SAT",
            "ortools_available": True,
            "max_solve_seconds": 3.0,
            "km_proximity_threshold_km": 5.0,
            "train_buffer_mins": 15,
            "db_stats": {
                "total_defects":     defect_count,
                "pending_defects":   pending_count,
                "total_trains":      train_count,
                "total_block_plans": block_count,
                "approved_blocks":   approved_count,
            },
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        }
    finally:
        db.close()


@router.post("/blocks/{block_id}/approve", response_model=dict)
def approve_block(block_id: int) -> dict:
    db = get_db()
    try:
        db.execute("UPDATE blocks SET status='Approved' WHERE id=?", (block_id,))
        db.commit()
        row = db.execute("SELECT * FROM blocks WHERE id=?", (block_id,)).fetchone()
        return {"success": True, "block": dict(row)}
    finally:
        db.close()


@router.post("/block/save", response_model=dict)
def save_block(data: dict) -> dict:
    """Save an AI-generated optimization result as a block record."""
    db = get_db()
    try:
        count = db.execute("SELECT COUNT(*) FROM blocks").fetchone()[0]
        block_code = f"MB-2026-{count + 81:03d}"
        corridor_row = db.execute(
            "SELECT id FROM corridors WHERE code=?", (data.get("corridor_code", "C1"),)
        ).fetchone()
        corridor_id = corridor_row["id"] if corridor_row else 1
        task_ids_str = ",".join(str(t.get("id", 1)) for t in data.get("tasks", []))
        depts_str = ",".join(data.get("departments", []))

        db.execute(
            """INSERT INTO blocks (block_code,corridor_id,start_time,end_time,duration_hours,
               departments,task_ids,priority_score,train_conflicts,estimated_delay_min,
               block_utilization,status,ai_generated,reason)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                block_code, corridor_id,
                data.get("start_time"), data.get("end_time"),
                data.get("duration_hours", 4.0),
                depts_str, task_ids_str,
                data.get("priority_score", 94.0),
                data.get("train_conflicts", 0),
                data.get("estimated_delay_min", 0),
                data.get("block_utilization", 96.0),
                "Approved", 1,
                "; ".join(data.get("explanation", []))[:500],
            ),
        )
        db.commit()
        return {"success": True, "block_code": block_code}
    finally:
        db.close()
