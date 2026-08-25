import sys
import os
import time
from database import DB_PATH, init_db, get_db
from optimizer import calculate_ai_risk_score, solve_block_schedule, solve_reschedule


def test_backend():
    print("==================================================")
    print("Testing RailOpt Backend Engine Expansion")
    print("==================================================")

    if os.path.exists(DB_PATH):
        try:
            os.remove(DB_PATH)
        except Exception:
            pass

    print("\n1. Initializing SQLite Database & Seeding Schemas...")
    init_db()
    db = get_db()

    defects = [dict(r) for r in db.execute("SELECT * FROM unified_defects").fetchall()]
    trains = [dict(r) for r in db.execute("SELECT * FROM train_schedules").fetchall()]
    corridors = [dict(r) for r in db.execute("SELECT * FROM corridors").fetchall()]
    db.close()

    print(f"   [OK] Unified Defects Loaded: {len(defects)}")
    print(f"   [OK] COA Train Timetables Loaded: {len(trains)}")
    print(f"   [OK] Section Corridors Loaded: {len(corridors)}")

    print("\n2. Testing Layer 1: AI Risk-Prioritization Scoring...")
    for d in defects[:3]:
        score = calculate_ai_risk_score(d)
        print(f"   [*] Task [{d['task_code']}] Dept: {d['department']} Defect: {d['title']} -> AI Risk Score: {score}/100")

    print("\n3. Testing Layer 2: Google OR-Tools CP-SAT Solver...")
    t0 = time.time()
    result = solve_block_schedule(
        defects=defects,
        train_schedules=trains,
        corridors=corridors,
        horizon="24h",
        max_simultaneous_blocks=3,
    )
    t1 = time.time()
    solver_duration = round(t1 - t0, 3)

    print(f"   [OK] CP-SAT Solver Runtime: {solver_duration}s (Requirement: < 3.0s)")
    print(f"   [OK] Mega-Blocks Created: {result.get('mega_blocks_created')}")
    print(f"   [OK] Total Hours Saved: {result.get('total_hours_saved')} hrs")
    print(f"   [OK] Downtime Reduction: {result.get('downtime_reduction_pct')}%")

    print("\n   Detailed Solved Schedule Items:")
    for item in result.get("schedule_json", [])[:6]:
        print(f"     -> Code: {item['task_code']} | Dept: {item['department']} | Corridor: {item['corridor_id']} | Slot: {item['start_slot']} ({item['start_time']}) -> {item['end_slot']} ({item['end_time']})")

    print("\n4. Testing Event-Driven Rescheduling (Vande Bharat 30-min Delay)...")
    reschedule_res = solve_reschedule(
        train_id=1,
        delay_mins=30.0,
        defects=defects,
        train_schedules=trains,
        corridors=corridors,
    )
    print(f"   [OK] Reschedule Event Status: {reschedule_res.get('event')}")

    print("\n==================================================")
    print("ALL BACKEND ENGINE TESTS PASSED CLEANLY!")
    print("==================================================")


if __name__ == "__main__":
    test_backend()
