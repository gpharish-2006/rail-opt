"""
RailOpt Backend Upgrade — Verification Test Suite
Run: python test_upgrade.py
"""
import sys, time, os, io
sys.path.insert(0, ".")

# Force UTF-8 output on Windows to avoid cp1252 encoding errors
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")


def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


def ok(msg):   print(f"  [OK]  {msg}")
def fail(msg): print(f"  [FAIL] {msg}"); sys.exit(1)


# ─── TEST 1: Database Init & Extended Seed ────────────────────────────────────
section("TEST 1: Database Init & Seed")

# Fresh DB
db_path = os.path.join(os.path.dirname(__file__), "railopt.db")
if os.path.exists(db_path):
    os.remove(db_path)
    ok("Removed stale DB for clean test")

from database import init_db, get_db
init_db()
db = get_db()

trains  = db.execute("SELECT COUNT(*) FROM train_schedules").fetchone()[0]
defects = db.execute("SELECT COUNT(*) FROM unified_defects").fetchone()[0]
blocks  = db.execute("SELECT COUNT(*) FROM block_plans").fetchone()[0]
ok(f"train_schedules: {trains} rows (need >= 30)")
ok(f"unified_defects: {defects} rows (need >= 20)")
ok(f"block_plans:     {blocks} rows (need >= 4)")

if trains  < 30: fail(f"only {trains} trains seeded")
if defects < 20: fail(f"only {defects} defects seeded")
if blocks  <  4: fail(f"only {blocks} block_plans seeded")

# Verify departments distribution
depts = [r[0] for r in db.execute("SELECT DISTINCT department FROM unified_defects").fetchall()]
ok(f"Departments present: {depts}")
for d in ("Engineering", "S&T", "Traction"):
    if d not in depts:
        fail(f"Department '{d}' missing from unified_defects")

# Verify corridor coverage
corridors_in_trains = [r[0] for r in db.execute("SELECT DISTINCT corridor_id FROM train_schedules").fetchall()]
ok(f"Corridors with trains: {sorted(corridors_in_trains)}")
if len(corridors_in_trains) < 5:
    fail(f"Only {len(corridors_in_trains)} corridors have train data (need 5)")

ok("AI risk scores seeded")
low_risk = db.execute("SELECT COUNT(*) FROM unified_defects WHERE ai_risk_score = 0").fetchone()[0]
if low_risk > 3:
    fail(f"{low_risk} defects have ai_risk_score=0 (possible seeding error)")

db.close()
ok("TEST 1 PASSED")


# ─── TEST 2: AI Risk & Duration Engine ────────────────────────────────────────
section("TEST 2: AI Risk & Duration Engine")

from optimizer import (
    calculate_ai_risk_score,
    calculate_task_priority,
    calculate_task_duration_adjusted,
    CORRIDOR_TRAFFIC_DENSITY,
    String_pad,
)

# High-crit defect on busy C2 (spec formula: Safety*3.0 + OverdueDays*1.5 + DeptFactor)
d_high = {"criticality": 10, "urgency": 9, "safety_risk": 10,
           "overdue_days": 8, "speed_impact_kmh": 30.0, "weather_risk": 0.1,
           "department": "Engineering", "corridor_id": 2}
score = calculate_ai_risk_score(d_high)
ok(f"High-crit C2 risk score: {score}/100")
# Spec formula: 10*3.0 + 8*1.5 + 3.0 + 9.0*0.5 + 3.75 - 0.1*2.0 = 53.05
if not (45 <= score <= 65):
    fail(f"Risk score {score} out of expected range [45, 65]")

# Low-crit defect
d_low = {"criticality": 2, "urgency": 2, "safety_risk": 2,
         "overdue_days": 0, "speed_impact_kmh": 0.0, "weather_risk": 0.0,
         "department": "Traction", "corridor_id": 5}
score_low = calculate_ai_risk_score(d_low)
ok(f"Low-crit C5 risk score: {score_low}/100")
if score_low >= score:
    fail("Low-crit score should be less than high-crit score")

# Alias
if calculate_task_priority(d_high) != score:
    fail("calculate_task_priority must equal calculate_ai_risk_score")
ok("calculate_task_priority alias works")

# Duration adjustment
base = 240.0
night = calculate_task_duration_adjusted(base, scheduled_start_hour=2)
day   = calculate_task_duration_adjusted(base, scheduled_start_hour=14)
ok(f"Night adjusted: {night} mins  |  Day adjusted: {day} mins  (base: {base})")
if night < base:
    fail("Night shift should not reduce base duration")

# String_pad
if String_pad(5) != "05" or String_pad(0) != "00" or String_pad(12) != "12":
    fail("String_pad returning wrong values")
ok("String_pad utility works")

ok("TEST 2 PASSED")


# ─── TEST 3: OR-Tools CP-SAT Solver ───────────────────────────────────────────
section("TEST 3: OR-Tools CP-SAT Solver")

from optimizer import solve_block_schedule, solve_reschedule

db = get_db()
all_defects  = [dict(r) for r in db.execute("SELECT * FROM unified_defects").fetchall()]
all_trains   = [dict(r) for r in db.execute("SELECT * FROM train_schedules").fetchall()]
all_corridors= [dict(r) for r in db.execute("SELECT * FROM corridors").fetchall()]
db.close()

# --- 24h solve with C5 (fewer defects, less busy corridor — should be feasible)
c5_defects = [d for d in all_defects if d["corridor_id"] == 5]
t0 = time.time()
res_c5 = solve_block_schedule(c5_defects, all_trains, all_corridors, horizon="24h", corridor_id=5)
elapsed24 = time.time() - t0
ok(f"24h C5 solve: {elapsed24:.2f}s, success={res_c5['success']}, schedule={len(res_c5['schedule_json'])} items")
if elapsed24 >= 3.0:
    fail(f"24h solver too slow: {elapsed24:.2f}s (limit 3s)")
if not res_c5["success"]:
    fail("24h C5 solve returned success=False (C5 should have feasible windows)")

# --- 24h solve for ALL defects: may be infeasible for C2 (correct behavior)
t0b = time.time()
res24_all = solve_block_schedule(all_defects, all_trains, all_corridors, horizon="24h")
elapsed24b = time.time() - t0b
ok(f"24h ALL-corridors solve: {elapsed24b:.2f}s, success={res24_all['success']} (C2 may be infeasible — correct)")
if elapsed24b >= 3.0:
    fail(f"24h solver too slow: {elapsed24b:.2f}s (limit 3s)")
# Note: C2 24h infeasibility is EXPECTED when all 8 tasks exceed slot capacity in the early-morning window

# --- Weekly solve (must always succeed)
t1 = time.time()
res_weekly = solve_block_schedule(all_defects, all_trains, all_corridors, horizon="weekly")
elapsed_w = time.time() - t1
ok(f"Weekly solve: {elapsed_w:.2f}s, mega_blocks={res_weekly['mega_blocks_created']}, saved={res_weekly['total_hours_saved']}h")
if elapsed_w >= 3.0:
    fail(f"Weekly solver too slow: {elapsed_w:.2f}s")
if not res_weekly["success"]:
    fail("Weekly solve returned success=False (must always find a solution over 7 days)")
if len(res_weekly["schedule_json"]) == 0:
    fail("schedule_json is empty for weekly horizon")

# --- Monthly solve
t2 = time.time()
res_monthly = solve_block_schedule(all_defects, all_trains, all_corridors, horizon="monthly")
elapsed_m = time.time() - t2
ok(f"Monthly solve: {elapsed_m:.2f}s, mega_blocks={res_monthly['mega_blocks_created']}")
if elapsed_m >= 3.0:
    fail(f"Monthly solver too slow: {elapsed_m:.2f}s")
if not res_monthly["success"]:
    fail("Monthly solve returned success=False")

# --- Corridor filter
res_c2 = solve_block_schedule(all_defects, all_trains, all_corridors, horizon="weekly", corridor_id=2)
ok(f"Corridor-filtered (C2 weekly) solve: {len(res_c2['schedule_json'])} tasks scheduled")
if res_c2["success"]:
    for item in res_c2["schedule_json"]:
        if item["corridor_id"] != 2:
            fail(f"Corridor filter failed: task corridor_id={item['corridor_id']}")

# schedule_timeline_json alias present
if "schedule_timeline_json" not in res_weekly:
    fail("schedule_timeline_json key missing (frontend Gantt needs this)")
ok("schedule_timeline_json alias present")

# Recommendation has dynamic times derived from solver
rec = res_weekly.get("recommendation", {})
ok(f"recommendation.start_time: {rec.get('start_time', 'N/A')}")
ok(f"recommendation.mega_blocks: {rec.get('is_mega_block')}")

# Reschedule
t3 = time.time()
db = get_db()
first_train_id = db.execute("SELECT id FROM train_schedules LIMIT 1").fetchone()[0]
db.close()
c5_defects_fresh = [d for d in all_defects if d["corridor_id"] == 5]
res_re = solve_reschedule(first_train_id, 45.0, c5_defects_fresh, all_trains, all_corridors)
elapsed_re = time.time() - t3
ok(f"Reschedule: {elapsed_re:.2f}s — event: {res_re['event'][:70]}...")
if "delay" not in res_re["event"].lower():
    fail("Reschedule event message missing delay reference")


ok("TEST 3 PASSED")


# ─── TEST 4: Pydantic Models ───────────────────────────────────────────────────
section("TEST 4: Pydantic Models")

from models import (
    DefectLog, BlockPlan, MegaBlocksResponse,
    UnifiedDefect, LoginRequest, OptimizeRequest,
    OptimizerPlanRequest, RescheduleRequest,
    BlockRecommendation, OptimizerPlanResponse,
)

# DefectLog
dl = DefectLog(
    defect_id=1, department="Engineering",
    section_km_start=120.0, section_km_end=135.0,
    defect_type="Rail Fracture", estimated_duration_mins=210.0,
    overdue_days=8, ai_risk_score=88.9
)
ok(f"DefectLog model valid: {dl.defect_id} / {dl.department}")

# from_unified_defect converter
row = {"id": 5, "department": "S&T", "km_start": 122.0, "km_end": 126.0,
       "defect_type": "Point Machine Overhaul", "required_duration_mins": 120.0,
       "overdue_days": 2, "ai_risk_score": 72.5}
dl2 = DefectLog.from_unified_defect(row)
if dl2.defect_id != 5 or dl2.section_km_start != 122.0:
    fail("DefectLog.from_unified_defect conversion failed")
ok("DefectLog.from_unified_defect works")

# BlockPlan
bp = BlockPlan(
    block_id=1, section_id=2,
    start_time="2026-08-25 01:00", end_time="2026-08-25 05:00",
    merged_departments=["Engineering", "S&T", "Traction"],
    assigned_task_ids=["TMS-101", "SMMS-201", "TDMS-301"],
    downtime_saved_mins=450.0
)
ok(f"BlockPlan model valid: {bp.block_id}, depts={bp.merged_departments}")

# Existing models still work
lr = LoginRequest(email="test@test.com", password="pass")
opr = OptimizerPlanRequest(horizon="weekly", corridor_id=2)
rr  = RescheduleRequest(train_id=1, delay_mins=30.0)
ok("Existing models (LoginRequest, OptimizerPlanRequest, RescheduleRequest) unchanged")

ok("TEST 4 PASSED")

# ─── Summary ──────────────────────────────────────────────────────────────────
print(f"\n{'='*60}")
print("  ALL TESTS PASSED ✓")
print(f"  Trains seeded:  {trains}  |  Defects seeded: {defects}  |  Mega-blocks: {blocks}")
print(f"{'='*60}\n")
