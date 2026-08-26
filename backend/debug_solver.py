"""Debug solver feasibility"""
import sys
sys.path.insert(0, ".")
from database import get_db
from optimizer import solve_block_schedule
from ortools.sat.python import cp_model
import math

db = get_db()
defects   = [dict(r) for r in db.execute("SELECT * FROM unified_defects").fetchall()]
trains    = [dict(r) for r in db.execute("SELECT * FROM train_schedules").fetchall()]
corridors = [dict(r) for r in db.execute("SELECT * FROM corridors").fetchall()]
db.close()

print(f"Defects: {len(defects)}, Trains: {len(trains)}")

# Debug: check train slots vs defect durations for C2
c2_defects = [d for d in defects if d["corridor_id"] == 2]
hi_trains  = [t for t in trains if t["corridor_id"] == 2 and t["priority_score"] >= 8.0]

print(f"\nC2 high-priority trains ({len(hi_trains)}):")
busy_slots = []
for t in hi_trains:
    dep = t["departure_time"]
    arr = t["arrival_time"]
    dh, dm = map(int, dep.split(":"))
    ah, am = map(int, arr.split(":"))
    ts = dh * 4 + dm // 15
    te = ah * 4 + am // 15
    if te <= ts:
        te += 96
    busy_slots.append((ts, te, t["priority_score"], t["name"][:30]))
    print(f"  {t['train_no']} {t['name'][:25]}: dep={dep} arr={arr} slots={ts}-{te}")

# See available windows in 24h
print("\nFree windows in 24h horizon (96 slots):")
occupied = set()
for ts, te, _, _ in busy_slots:
    for s in range(ts - 1, min(te + 2, 96)):
        occupied.add(s)
free_windows = []
start = None
for s in range(96):
    if s not in occupied and start is None:
        start = s
    elif s in occupied and start is not None:
        free_windows.append((start, s - 1, s - start))
        start = None
if start is not None:
    free_windows.append((start, 95, 96 - start))

for ws, we, dur in free_windows:
    hrs = dur * 0.25
    print(f"  slots {ws}-{we} ({ws//4:02d}:{(ws%4)*15:02d} to {we//4:02d}:{(we%4)*15:02d}) = {hrs:.1f}h")

# Check if any C2 defect fits
print(f"\nC2 defects and their duration slots:")
for d in c2_defects:
    dur_m = d["required_duration_mins"]
    dur_s = max(1, math.ceil(dur_m / 15.0))
    fits = any(dur_s <= wdur for _, _, wdur in free_windows)
    print(f"  {d['task_code']}: {dur_m}min = {dur_s} slots, fits_in_24h={fits}")

# Try 24h with just 2 simple tasks
print("\nTrying 24h with 2 simple C5 tasks (no high-priority trains on C5):")
c5_defects = [d for d in defects if d["corridor_id"] == 5][:2]
res = solve_block_schedule(c5_defects, trains, corridors, horizon="24h")
print(f"  success={res['success']}, schedule_len={len(res['schedule_json'])}")

# Try with all defects, weekly
print("\nTrying weekly horizon, all defects:")
res2 = solve_block_schedule(defects, trains, corridors, horizon="weekly")
print(f"  success={res2['success']}, schedule_len={len(res2['schedule_json'])}, mega_blocks={res2['mega_blocks_created']}")
