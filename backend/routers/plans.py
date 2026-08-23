from fastapi import APIRouter
from database import get_db
from datetime import date, timedelta

router = APIRouter(prefix="/api/plans", tags=["plans"])


@router.get("/weekly")
def get_weekly_plan(week_start: str = None):
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

        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        result = []
        for r in rows:
            d = dict(r)
            d["day_name"] = days[d["day_of_week"]] if d["day_of_week"] is not None else ""
            result.append(d)
        return {"week_start": week_start, "plans": result}
    finally:
        db.close()
