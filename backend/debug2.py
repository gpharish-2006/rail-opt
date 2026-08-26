"""Debug: trace exact constraint math for 24h infeasibility"""
import sys, math
sys.path.insert(0, ".")
from database import get_db
from optimizer import calculate_task_duration_adjusted

db = get_db()
defects   = [dict(r) for r in db.execute("SELECT * FROM unified_defects WHERE corridor_id=2").fetchall()]
trains    = [dict(r) for r in db.execute("SELECT * FROM train_schedules WHERE corridor_id=2 AND priority_score>=8").fetchall()]
db.close()

horizon_slots = 96
MIN_BUF = 1

print(f"=== C2 Defects ===")
for d in defects:
    base = d["required_duration_mins"]
    adj  = calculate_task_duration_adjusted(base, scheduled_start_hour=2)
    dur_s = max(1, math.ceil(adj / 15.0))
    print(f"  {d['task_code']}: base={base}m adj={adj}m dur_slots={dur_s}")

print(f"\n=== C2 High-Priority Train Windows ===")
train_slots = []
for t in trains:
    dep = t["departure_time"]
    arr = t["arrival_time"]
    dh, dm = map(int, dep.split(":"))
    ah, am = map(int, arr.split(":"))
    ts = dh * 4 + dm // 15
    te = ah * 4 + am // 15
    if te <= ts:
        te += 96
    effective_end = min(te, horizon_slots)
    before_limit = max(0, ts - MIN_BUF)
    after_limit  = min(horizon_slots, effective_end + MIN_BUF)
    print(f"  {t['train_no']} slots={ts}-{te} eff_end={effective_end} before_lim={before_limit} after_lim={after_limit}")
    train_slots.append((ts, te, effective_end, before_limit, after_limit, t["train_no"]))

print(f"\n=== Feasibility check per defect ===")
for d in defects:
    base = d["required_duration_mins"]
    adj  = calculate_task_duration_adjusted(base, scheduled_start_hour=2)
    dur_s = max(1, math.ceil(adj / 15.0))
    issues = []
    for ts, te, effective_end, before_limit, after_limit, train_no in train_slots:
        can_before = before_limit >= dur_s
        can_after  = after_limit + dur_s <= horizon_slots
        if not can_before and not can_after:
            issues.append(f"{train_no}(dur={dur_s},bl={before_limit},al={after_limit})")
    if issues:
        print(f"  {d['task_code']} (dur_slots={dur_s}): INFEASIBLE with trains: {issues}")
    else:
        print(f"  {d['task_code']} (dur_slots={dur_s}): OK")
