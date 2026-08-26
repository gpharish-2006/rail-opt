from fastapi import APIRouter
from database import get_db
from datetime import date, timedelta
import json
from optimizer import solve_block_schedule

router = APIRouter(prefix="/api/plans", tags=["plans"])


@router.get("/weekly")
def get_weekly_plan(week_start: str = None):
    """
    Returns the weekly maintenance plan with blocks and Mega-Block details.
    Includes both the legacy blocks table and the richer block_plans table.
    """
    db = get_db()
    try:
        if not week_start:
            today = date.today()
            monday = today - timedelta(days=today.weekday())
            week_start = str(monday)

        rows = db.execute("""
            SELECT wp.*, b.block_code, b.start_time, b.end_time, b.duration_hours,
                   b.departments, b.priority_score, b.train_conflicts, b.status as block_status,
                   b.estimated_delay_min, b.block_utilization, b.task_ids,
                   c.code as corridor_code, c.name as corridor_name
            FROM weekly_plans wp
            LEFT JOIN blocks b ON wp.block_id = b.id
            LEFT JOIN corridors c ON b.corridor_id = c.id
            WHERE wp.week_start = ?
            ORDER BY wp.day_of_week
        """, (week_start,)).fetchall()

        # Also fetch matching block_plans (Mega-Blocks) for the same week
        week_end = str(date.fromisoformat(week_start) + timedelta(days=6))
        mega_rows = db.execute("""
            SELECT bp.*, c.code as corridor_code, c.name as corridor_name
            FROM block_plans bp
            LEFT JOIN corridors c ON bp.corridor_id = c.id
            WHERE DATE(bp.start_time) BETWEEN ? AND ?
            ORDER BY bp.start_time
        """, (week_start, week_end)).fetchall()

        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        result = []
        for r in rows:
            d = dict(r)
            d["day_name"] = days[d["day_of_week"]] if d["day_of_week"] is not None else ""
            result.append(d)

        # Decode mega-block JSON fields
        mega_blocks = []
        for m in mega_rows:
            mb = dict(m)
            try:
                mb["merged_departments"] = json.loads(mb.get("merged_departments", "[]"))
            except (json.JSONDecodeError, TypeError):
                mb["merged_departments"] = []
            try:
                mb["assigned_tasks"] = json.loads(mb.get("assigned_tasks", "[]"))
            except (json.JSONDecodeError, TypeError):
                mb["assigned_tasks"] = []
            mega_blocks.append(mb)

        return {
            "week_start":   week_start,
            "week_end":     week_end,
            "plans":        result,
            "mega_blocks":  mega_blocks,
            "total_plans":  len(result),
            "total_mega_blocks": len(mega_blocks),
        }
    finally:
        db.close()


@router.get("/mega-blocks")
def get_mega_blocks(
    corridor_id: int = None,
    status: str = None,
    is_mega_block: bool = True,
):
    """
    Returns all Mega-Block plans from the block_plans table.
    JSON fields (merged_departments, assigned_tasks) are decoded into lists.

    Query params:
        corridor_id:    Filter to a specific corridor
        status:         'Proposed' | 'Approved' | 'Completed'
        is_mega_block:  Default True — set False to include single-dept blocks
    """
    db = get_db()
    try:
        query = """
            SELECT bp.*, c.code as corridor_code, c.name as corridor_name
            FROM block_plans bp
            LEFT JOIN corridors c ON bp.corridor_id = c.id
            WHERE bp.is_mega_block = ?
        """
        params = [1 if is_mega_block else 0]

        if corridor_id:
            query += " AND bp.corridor_id=?"
            params.append(corridor_id)
        if status:
            query += " AND bp.status=?"
            params.append(status)

        query += " ORDER BY bp.priority_score DESC, bp.start_time ASC"

        rows = db.execute(query, params).fetchall()

        mega_blocks = []
        total_downtime_saved = 0.0
        for r in rows:
            mb = dict(r)
            # Decode JSON list fields
            try:
                mb["merged_departments"] = json.loads(mb.get("merged_departments", "[]"))
            except (json.JSONDecodeError, TypeError):
                mb["merged_departments"] = []
            try:
                mb["assigned_tasks"] = json.loads(mb.get("assigned_tasks", "[]"))
            except (json.JSONDecodeError, TypeError):
                mb["assigned_tasks"] = []

            saved = float(mb.get("calculated_downtime_saved_mins", 0.0))
            total_downtime_saved += saved
            mega_blocks.append(mb)

        return {
            "success":                    True,
            "total":                      len(mega_blocks),
            "mega_blocks":                mega_blocks,
            "total_downtime_saved_mins":  round(total_downtime_saved, 1),
            "total_downtime_saved_hours": round(total_downtime_saved / 60.0, 2),
        }
    finally:
        db.close()


@router.get("/monthly")
def get_monthly_plan(
    month: int = None,
    year: int = None,
    corridor_id: int = None,
):
    """
    Returns the monthly maintenance plan (long-term overhaul horizon).
    Uses the OR-Tools CP-SAT solver with a monthly horizon to generate
    optimized block allocations across all corridors.
    """
    db = get_db()
    try:
        today = date.today()
        target_month = month or today.month
        target_year = year or today.year
        month_start = f"{target_year}-{target_month:02d}-01"
        if target_month == 12:
            month_end = f"{target_year + 1}-01-01"
        else:
            month_end = f"{target_year}-{target_month + 1:02d}-01"

        # Fetch defects, trains, corridors for the solver
        defects_query = "SELECT * FROM unified_defects WHERE status != 'Completed'"
        defects_params = []
        if corridor_id:
            defects_query += " AND corridor_id=?"
            defects_params.append(corridor_id)
        defects = [dict(r) for r in db.execute(defects_query, defects_params).fetchall()]
        if not defects:
            defects = [dict(r) for r in db.execute("SELECT * FROM maintenance_tasks").fetchall()]

        trains_query = "SELECT * FROM train_schedules WHERE 1=1"
        trains_params = []
        if corridor_id:
            trains_query += " AND corridor_id=?"
            trains_params.append(corridor_id)
        trains = [dict(r) for r in db.execute(trains_query, trains_params).fetchall()]
        if not trains:
            trains = [dict(r) for r in db.execute("SELECT * FROM trains").fetchall()]

        corridors = [dict(r) for r in db.execute("SELECT * FROM corridors").fetchall()]

        # Run the monthly-horizon solver
        result = solve_block_schedule(
            defects=defects,
            train_schedules=trains,
            corridors=corridors,
            horizon="monthly",
            max_simultaneous_blocks=3,
            target_date=month_start,
            corridor_id=corridor_id,
        )

        # Build weekly breakdown from the monthly schedule
        weekly_breakdown = []
        if result["success"] and result["schedule_json"]:
            week_groups = {}
            for item in result["schedule_json"]:
                start_slot = item.get("start_slot", 0)
                day_index = start_slot // 96  # 96 slots per day
                week_num = day_index // 7 + 1
                week_key = f"Week {week_num}"
                if week_key not in week_groups:
                    week_groups[week_key] = {
                        "week": week_key,
                        "tasks": [],
                        "departments": set(),
                        "total_duration_hours": 0.0,
                    }
                week_groups[week_key]["tasks"].append(item)
                week_groups[week_key]["departments"].add(item.get("department", ""))
                week_groups[week_key]["total_duration_hours"] += item.get("duration_hours", 0)

            for wk, data in week_groups.items():
                weekly_breakdown.append({
                    "week": wk,
                    "task_count": len(data["tasks"]),
                    "departments": list(data["departments"]),
                    "total_duration_hours": round(data["total_duration_hours"], 2),
                })

        return {
            "success": True,
            "month": target_month,
            "year": target_year,
            "month_start": month_start,
            "month_end": month_end,
            "horizon": "monthly",
            "mega_blocks_created": result["mega_blocks_created"],
            "total_hours_saved": result["total_hours_saved"],
            "downtime_reduction_pct": result["downtime_reduction_pct"],
            "total_tasks_scheduled": len(result["schedule_json"]),
            "schedule_json": result["schedule_json"],
            "schedule_timeline_json": result.get("schedule_timeline_json", []),
            "weekly_breakdown": weekly_breakdown,
            "recommendation": result.get("recommendation", {}),
        }
    finally:
        db.close()
