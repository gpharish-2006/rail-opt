"""
RailOpt AI — Deterministic Block Optimization Algorithm
=======================================================
No ML model. Pure deterministic greedy scoring.

Priority Score weights:
  35% Criticality
  25% Urgency
  20% Safety Risk
  10% Overdue
  10% Train Impact

Optimization objective:
  Minimize: num_blocks, block_duration, train_conflicts, delay, critical_downtime
  Maximize: maintenance_priority, block_utilization, multi_dept_coordination, asset_availability
"""

from datetime import datetime, timedelta, date
import math
from typing import List, Dict, Any, Optional


# ── Candidate time windows (start_hour, end_hour, label) ──────────────────────
CANDIDATE_WINDOWS = [
    (1,  5,  "01:00 AM – 05:00 AM"),
    (5,  7,  "05:00 AM – 07:00 AM"),
    (10, 14, "10:00 AM – 02:00 PM"),
    (14, 17, "02:00 PM – 05:00 PM"),
    (22, 2,  "10:00 PM – 02:00 AM"),
]

KM_PROXIMITY = 8.0   # tasks within 8 km are compatible for combining


def _score_task(task: Dict) -> float:
    crit = task.get("criticality", 5)
    urg  = task.get("urgency", 5)
    safe = task.get("safety_risk", 5)
    ov   = min(10, task.get("overdue_days", 0) / 6.0)
    tim  = task.get("train_impact", 5)
    return round(0.35 * crit + 0.25 * urg + 0.20 * safe + 0.10 * ov + 0.10 * tim, 2)


def _tasks_compatible(t1: Dict, t2: Dict) -> bool:
    """Two tasks are compatible if they are on the same corridor and nearby km."""
    if t1.get("corridor_id") != t2.get("corridor_id"):
        return False
    km1_start = t1.get("km_start") or 0
    km1_end   = t1.get("km_end") or km1_start
    km2_start = t2.get("km_start") or 0
    km2_end   = t2.get("km_end") or km2_start
    # check overlap or proximity
    gap = max(0, max(km1_start, km2_start) - min(km1_end, km2_end))
    return gap <= KM_PROXIMITY


def _group_tasks(tasks: List[Dict]) -> List[List[Dict]]:
    """Greedy grouping: merge compatible tasks into groups."""
    groups: List[List[Dict]] = []
    assigned = set()
    # sort by descending priority_score
    sorted_tasks = sorted(tasks, key=lambda t: _score_task(t), reverse=True)
    for t in sorted_tasks:
        if t["id"] in assigned:
            continue
        group = [t]
        assigned.add(t["id"])
        for other in sorted_tasks:
            if other["id"] in assigned:
                continue
            if _tasks_compatible(t, other):
                group.append(other)
                assigned.add(other["id"])
        groups.append(group)
    return groups


def _count_train_conflicts(
    corridor_id: int,
    start_h: int,
    end_h: int,
    target_date: date,
    trains: List[Dict],
) -> tuple:
    """
    Returns (num_conflicts, estimated_delay_min).
    A conflict occurs when a train traverses the corridor during block window.
    """
    conflicts = 0
    total_delay = 0.0
    day_name = target_date.strftime("%a")  # Mon, Tue …
    for train in trains:
        if train.get("corridor_id") != corridor_id:
            continue
        days = train.get("days_of_week", "")
        if day_name not in days:
            continue
        dep = train.get("departure_time", "00:00")
        try:
            dep_h, dep_m = map(int, dep.split(":"))
        except Exception:
            continue
        dep_frac = dep_h + dep_m / 60.0
        # block window overlap check
        if start_h <= end_h:
            overlap = start_h <= dep_frac < end_h
        else:  # crosses midnight
            overlap = dep_frac >= start_h or dep_frac < end_h
        if overlap:
            conflicts += 1
            # delay estimate based on train priority
            priority = train.get("priority", "Normal")
            if priority == "Critical":
                total_delay += 15.0
            elif priority == "High":
                total_delay += 10.0
            else:
                total_delay += 5.0
    return conflicts, round(total_delay, 1)


def _window_score(
    group: List[Dict],
    win_start: int,
    win_end: int,
    win_label: str,
    target_date: date,
    trains: List[Dict],
    corridor_id: int,
) -> Dict:
    """Score a candidate window for a group of tasks."""
    # Combined duration = max (parallel work) + 10% buffer
    max_dur = max(t.get("duration_hours", 1.0) for t in group)
    combined_dur = round(max_dur * 1.10, 2)

    # Window length in hours
    if win_end > win_start:
        window_dur = win_end - win_start
    else:
        window_dur = (24 - win_start) + win_end

    conflicts, delay = _count_train_conflicts(
        corridor_id, win_start, win_end, target_date, trains
    )

    # Priority score = weighted mean of group scores
    group_priority = round(
        sum(_score_task(t) for t in group) / len(group), 2
    )

    # Utilization = (max single-task duration) / window_duration
    utilization = round(min(100.0, (max_dur / window_dur) * 100), 1)

    # Multi-dept bonus (extra points for combining 2+ depts)
    depts = set(t.get("department", "") for t in group)
    dept_bonus = (len(depts) - 1) * 0.5  # +0.5 per extra dept

    # Composite window score (higher is better)
    # Normalized priority /10 * 10 scale → already 0-10
    w_score = (
        group_priority * 10           # 0-100: priority
        - conflicts * 5               # penalty per conflict
        + dept_bonus * 3              # reward multi-dept
        + utilization * 0.1           # small utilization reward
        - (delay / 60) * 10           # penalty for delay
    )

    # Normalize priority score to /100
    priority_100 = round(min(100, group_priority * 10), 1)

    return {
        "win_start": win_start,
        "win_end": win_end,
        "win_label": win_label,
        "combined_dur": combined_dur,
        "window_dur": window_dur,
        "conflicts": conflicts,
        "delay": delay,
        "priority_100": priority_100,
        "utilization": utilization,
        "depts": sorted(depts),
        "w_score": w_score,
    }


def optimize_blocks(
    tasks: List[Dict],
    trains: List[Dict],
    corridors: List[Dict],
    target_date: Optional[str] = None,
    corridor_id: Optional[int] = None,
    time_window_start: str = "00:00",
    time_window_end: str = "23:59",
    task_ids: Optional[List[int]] = None,
) -> Dict[str, Any]:
    """
    Main optimizer entry point.
    Returns the best block recommendation with full explanation.
    """
    if target_date:
        try:
            tgt = datetime.strptime(target_date, "%Y-%m-%d").date()
        except Exception:
            tgt = date.today()
    else:
        tgt = date.today()

    # Filter tasks
    pending = [t for t in tasks if t.get("status") == "Pending"]
    if task_ids:
        pending = [t for t in pending if t["id"] in task_ids]
    if corridor_id:
        pending = [t for t in pending if t.get("corridor_id") == corridor_id]
    if not pending:
        pending = tasks  # fallback: use all

    # Group compatible tasks
    groups = _group_tasks(pending)

    # Map corridors
    corridor_map = {c["id"]: c for c in corridors}

    # Evaluate every group × every window
    best_score = -9999
    best_rec = None

    for group in groups:
        cid = group[0].get("corridor_id", 1)
        corr = corridor_map.get(cid, {"code": "C1", "name": "Unknown Corridor"})

        for (ws, we, wlabel) in CANDIDATE_WINDOWS:
            scored = _window_score(group, ws, we, wlabel, tgt, trains, cid)
            if scored["w_score"] > best_score:
                best_score = scored["w_score"]
                best_rec = {
                    "group": group,
                    "corridor": corr,
                    "cid": cid,
                    "scored": scored,
                }

    if not best_rec:
        return {"error": "No valid optimization found"}

    group    = best_rec["group"]
    corr     = best_rec["corridor"]
    sc       = best_rec["scored"]

    ws_h = sc["win_start"]
    we_h = sc["win_end"]
    dur  = sc["combined_dur"]

    # Actual block start = window start, end = start + combined_dur
    dt_start = datetime(tgt.year, tgt.month, tgt.day, ws_h % 24, 0)
    dt_end   = dt_start + timedelta(hours=dur)

    # Build explanation bullets
    explanation = []
    if any(t.get("criticality", 0) >= 8 for t in group):
        explanation.append("Critical maintenance tasks included in block")
    depts = sc["depts"]
    explanation.append(f"Departments coordinated: {', '.join(depts)}")
    if len(depts) > 1:
        explanation.append(f"Multi-department coordination saves {len(depts) - 1} separate block(s)")
    nearby = [t for t in group if abs((t.get("km_start") or 0) - (group[0].get("km_start") or 0)) <= KM_PROXIMITY]
    if len(nearby) > 1:
        explanation.append(f"{len(nearby)} tasks clustered within {KM_PROXIMITY} km radius")
    if sc["conflicts"] == 0:
        explanation.append("Zero train conflicts – optimal train-free window selected")
    elif sc["conflicts"] <= 2:
        explanation.append(f"Low train traffic in selected window ({sc['conflicts']} train(s) affected)")
    else:
        explanation.append(f"Minimum disruption window chosen ({sc['conflicts']} train conflict(s))")
    if sc["delay"] < 10:
        explanation.append(f"Estimated delay minimal at {sc['delay']} min")
    explanation.append(f"Block utilization at {sc['utilization']}% – highly efficient use of block time")
    overdue = [t for t in group if t.get("overdue_days", 0) > 0]
    if overdue:
        explanation.append(f"{len(overdue)} overdue task(s) addressed in this block")

    task_out = []
    for t in group:
        task_out.append({
            "id": t["id"],
            "task_code": t.get("task_code", ""),
            "title": t.get("title", ""),
            "department": t.get("department", ""),
            "km_start": t.get("km_start"),
            "km_end": t.get("km_end"),
            "duration_hours": t.get("duration_hours"),
            "criticality": t.get("criticality"),
            "priority_score": _score_task(t),
        })

    return {
        "corridor_code": corr.get("code", "C1"),
        "corridor_name": corr.get("name", ""),
        "start_time": dt_start.strftime("%Y-%m-%d %H:%M"),
        "end_time": dt_end.strftime("%Y-%m-%d %H:%M"),
        "duration_hours": dur,
        "departments": depts,
        "tasks": task_out,
        "priority_score": sc["priority_100"],
        "train_conflicts": sc["conflicts"],
        "estimated_delay_min": sc["delay"],
        "block_utilization": sc["utilization"],
        "explanation": explanation,
        "time_slot_label": sc["win_label"],
        "activities_combined": len(group),
        "window_label": f"{dt_start.strftime('%I:%M %p')} – {dt_end.strftime('%I:%M %p')}",
    }
