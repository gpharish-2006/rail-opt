#!/usr/bin/env python3
"""
RailOpt Seed Data — Standalone COA Train Timetable & Multi-Department Defect Seeder
====================================================================================
Populates the SQLite database with realistic test data for demo & development.

Usage:
    python seed_data.py          # Seed default data
    python seed_data.py --reset  # Drop and re-create all data

Contents:
    - 25 daily train slots (mix of passenger + freight) across shared section Km 120–160
    - 18 multi-department defect logs (TMS, SMMS, TDMS) on the shared section
    - 4 pre-computed Mega-Block plans
"""

import sys
import os
import argparse

sys.path.insert(0, os.path.dirname(__file__))

from datetime import date, timedelta
from database import init_db, get_db, DB_PATH


# ═══════════════════════════════════════════════════════════════════════════════
# TRAIN TIMETABLE SEED (COA — Control Office Application)
# ═══════════════════════════════════════════════════════════════════════════════
# Shared railway section: Corridor C2 (Delhi–Agra), Km 120–160
# Mix: Vande Bharat (priority=10), Rajdhani (9), Shatabdi (9.5), Superfast (7.5),
#      Express (7), Mail (6), Freight (3)

TRAIN_SLOTS = [
    # (train_no, name, type, corridor_id, origin, dest, dep, arr, days, priority, avg_delay)
    # ── High-Priority Passenger (priority >= 8) ─────────────────────────────
    ("22436", "Vande Bharat Express (Delhi–Agra)",        "Vande Bharat", 2, "NDLS", "AGC",  "06:00", "08:00", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", 10.0, 1.0),
    ("22691", "Vande Bharat Express (Agra–Delhi)",        "Vande Bharat", 2, "AGC",  "NDLS", "17:00", "19:00", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", 10.0, 1.5),
    ("12002", "Bhopal Shatabdi Express",                   "Shatabdi",     2, "NDLS", "BPL",  "06:15", "14:40", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  9.5, 3.0),
    ("12165", "Ajmer Shatabdi Express",                    "Shatabdi",     2, "NDLS", "AII",  "06:05", "12:55", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  9.5, 2.5),
    ("12952", "Mumbai Rajdhani Express",                   "Rajdhani",     2, "MMCT", "NDLS", "16:55", "08:35", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  9.0, 4.0),
    ("12953", "August Kranti Rajdhani",                    "Rajdhani",     2, "NDLS", "MMCT", "17:40", "10:10", "Mon,Wed,Fri,Sat",              9.0, 6.0),
    ("12275", "Duronto Express (Delhi–Mumbai)",            "Duronto",      2, "NDLS", "MMCT", "23:00", "14:45", "Tue,Fri",                       8.5, 5.0),

    # ── Regular Passenger (priority 5–7.5) ──────────────────────────────────
    ("12050", "Gatimaan Express",                          "Superfast",    2, "NDLS", "AGC",  "08:10", "09:50", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  8.0, 1.5),
    ("12137", "Punjab Mail",                               "Express",      2, "FZR",  "NDLS", "05:25", "20:15", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  7.0, 12.0),
    ("14311", "Ala Hazrat Express",                        "Express",      2, "BE",   "BAR",  "21:00", "09:30", "Mon,Fri",                       7.0, 15.0),
    ("14211", "New Delhi–Pratapgarh Intercity",            "Express",      2, "NDLS", "PBH",  "14:55", "04:25", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  6.5, 8.0),
    ("01001", "Mumbai Mail",                               "Mail",         2, "CSTM", "NDLS", "23:55", "16:55", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  6.0, 10.0),
    ("14003", "Malda Town–New Delhi Express",              "Express",      2, "MLDT", "NDLS", "12:30", "10:15", "Tue,Fri",                       7.0, 14.0),

    # ── Commuter / MEMU (priority 4–5) ─────────────────────────────────────
    ("64901", "Delhi–Mathura MEMU",                        "MEMU",         2, "NDLS", "MTJ",  "05:30", "08:15", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  5.0, 6.0),
    ("64902", "Mathura–Delhi MEMU",                        "MEMU",         2, "MTJ",  "NDLS", "17:45", "20:30", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  5.0, 5.0),
    ("64951", "Delhi–Kasganj Passenger",                   "Passenger",    2, "NDLS", "KSJ",  "06:20", "13:40", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  4.0, 9.0),

    # ── Freight / Goods (priority 2–3) ──────────────────────────────────────
    ("BTPN-99",  "Coal Freight NDLS–AGC",                 "Goods/Freight", 2, "NDLS", "AGC",  "01:30", "04:30", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  3.0, 0.0),
    ("BCNA-77",  "Container Freight JNPT",                "Goods/Freight", 2, "NDLS", "GZB",  "03:00", "05:00", "Tue,Thu,Sat",                   3.0, 0.0),
    ("BCNK-55",  "Oil Tanker Freight C2",                 "Goods/Freight", 2, "AGC",  "NDLS", "22:00", "01:00", "Mon,Wed,Fri",                   2.5, 0.0),
    ("BOXN-112", "Iron Ore Haul C2",                      "Goods/Freight", 2, "NDLS", "AGC",  "04:00", "07:30", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  2.5, 0.0),

    # ── Additional corridor trains (C1, C3, C4, C5) for cross-corridor solver ─
    ("22436X", "Vande Bharat (C1)",        "Vande Bharat", 1, "CSTM", "PUNE", "06:00", "08:40", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", 10.0, 1.5),
    ("22027X", "Vande Bharat (C3)",        "Vande Bharat", 3, "MAS",  "SBC",  "06:00", "10:30", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", 10.0, 1.5),
    ("22823X", "Vande Bharat (C4)",        "Vande Bharat", 4, "HWH",  "PNBE", "06:05", "11:30", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", 10.0, 2.0),
    ("22957X", "Vande Bharat (C5)",        "Vande Bharat", 5, "ADI",  "BRC",  "07:00", "08:20", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", 10.0, 0.5),
]


# ═══════════════════════════════════════════════════════════════════════════════
# DEFECT LOG SEED (TMS, SMMS, TDMS)
# ═══════════════════════════════════════════════════════════════════════════════
# All defects are within the shared section Km 120–160 on Corridor C2
# to test Mega-Block merging (ΔKM ≤ 5 cross-department incentive).

DEFECT_LOGS = [
    # (task_code, title, description, dept, defect_type, gear_id, corr_id,
    #  km_start, km_end, dur_mins, crit, urg, safety, overdue, spd_impact, weather, sch_date, requested_by)

    # ── TMS – Engineering (Track Maintenance System) — 6 defects ────────────
    ("TMS-101", "Rail Fracture Defect & Joint Inspection",
     "Micro-crack detected on head of 60kg rail via USFD Ultrasonic Testing at Km 122",
     "Engineering", "Rail Fracture",           "TRK-122", 2, 120.0, 135.0, 210, 10, 9, 10, 8, 30.0, 0.1),

    ("TMS-102", "Track Geometry Tamping & Alignment",
     "Deep ballast tamping and gauge correction required across Km 122–128",
     "Engineering", "Track Geometry Correction", "TRK-125", 2, 122.0, 128.0, 180, 7, 8, 7, 3, 15.0, 0.0),

    ("TMS-103", "Fishplate & Joint Bolt Tightening Km 130",
     "Loose fishplate joints at Km 130–135, risk of rail spread under load",
     "Engineering", "Fishplate Repair",        "TRK-130", 2, 130.0, 135.0, 120, 8, 8, 9, 6, 20.0, 0.0),

    ("TMS-104", "Ballast Cleaning KM 140–150",
     "Ballast fouling index exceeds 40%, drainage impaired across section",
     "Engineering", "Ballast Renewal",         "TRK-140", 2, 140.0, 150.0, 300, 7, 6, 7, 0, 10.0, 0.3),

    ("TMS-105", "Level Crossing Gate KM 145 Overhaul",
     "Interlocking gate mechanism stiff, motor overload alarm triggered",
     "Engineering", "LC Gate Repair",          "LC-145",  2, 145.0, 146.0, 90,  6, 7, 8, 4, 5.0, 0.0),

    ("TMS-106", "Turnout Switch Rail Grinding KM 155",
     "Switch rail profile worn beyond limits at high-speed turnout",
     "Engineering", "Switch Rail Grinding",    "TRK-155", 2, 154.0, 157.0, 150, 8, 7, 8, 2, 15.0, 0.0),

    # ── SMMS – S&T (Signalling & Telecom) — 6 defects ──────────────────────
    ("SMMS-201", "Point Machine Overhaul KM 124",
     "Point machine switch overhaul and lock bar calibration at Km 124",
     "S&T", "Point Machine Overhaul",  "PT-124",  2, 122.0, 126.0, 120, 8, 8, 8, 2, 10.0, 0.0),

    ("SMMS-202", "Track Circuit Audio Frequency KM 128",
     "AFTC track circuit bond wire replacement and frequency tuning",
     "S&T", "Track Circuit Fault",     "TC-128",  2, 126.0, 130.0, 90,  7, 7, 8, 0, 5.0, 0.0),

    ("SMMS-203", "Axle Counter Calibration KM 142",
     "Axle counter fail-safe mode triggered at Km 142 — recalibration needed",
     "S&T", "Axle Counter Fault",      "AXC-142", 2, 140.0, 144.0, 90,  9, 9, 9, 3, 20.0, 0.0),

    ("SMMS-204", "Signal Relay Overhaul SB-33 KM 156",
     "Signal relay room interlocking testing and aspect lamp replacement",
     "S&T", "Relay Overhaul",          "SB-33",   2, 155.0, 158.0, 180, 9, 9, 9, 15, 15.0, 0.1),

    ("SMMS-205", "BPAC Panel Wiring KM 132",
     "Block panel indication lamp intermittent at Km 132 — wiring loom check",
     "S&T", "Panel Wiring Fault",      "SB-132",  2, 131.0, 133.0, 60,  6, 6, 7, 0, 0.0, 0.0),

    ("SMMS-206", "Interlocking Circuit Testing KM 148",
     "Stick relay contact check for signal 2A on up main line at Km 148",
     "S&T", "Interlocking Test",       "SB-148",  2, 147.0, 149.0, 60,  7, 7, 8, 0, 10.0, 0.0),

    # ── TDMS – Traction (Traction Distribution) — 6 defects ────────────────
    ("TDMS-301", "OHE Cantilever Alignment KM 125",
     "Overhead contact wire height & stagger adjustment near mast 125/12",
     "Traction", "Cantilever Alignment",    "OHE-125", 2, 123.0, 130.0, 240, 8, 9, 9, 5, 20.0, 0.1),

    ("TDMS-302", "Vegetation Clearance OHE Feeder KM 128",
     "Tree branch trimming near 25kV feeder wire at Km 128 to prevent tripping",
     "Traction", "Vegetation Clearance",    "OHE-128", 2, 126.0, 132.0, 120, 6, 7, 7, 1, 0.0, 0.3),

    ("TDMS-303", "Section Insulator Replacement KM 132",
     "Worn section insulator causing arc flash at Km 132",
     "Traction", "Section Insulator Fault", "SI-132",  2, 131.0, 133.0, 150, 9, 9, 10, 7, 30.0, 0.0),

    ("TDMS-304", "OHE Stagger Correction KM 143",
     "Contact wire stagger out of limit at Km 143 — risk of pantograph dewirement",
     "Traction", "OHE Stagger Correction",  "OHE-143", 2, 141.0, 145.0, 120, 8, 8, 9, 2, 15.0, 0.2),

    ("TDMS-305", "Booster Transformer KM 156 Replacement",
     "Replacement of damaged 25kV booster transformer at Km 156",
     "Traction", "Transformer Overhaul",    "BT-156",  2, 155.0, 158.0, 210, 9, 9, 9, 10, 25.0, 0.0),

    ("TDMS-306", "Earth Fault Feeder KM 148",
     "Earth leakage detected on feeder cable near sub-station at Km 148",
     "Traction", "Earth Fault",             "SS-148",  2, 146.0, 150.0, 180, 9, 8, 9, 4, 20.0, 0.0),
]


# ═══════════════════════════════════════════════════════════════════════════════
# SEED FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

DEPT_FACTORS = {"Engineering": 3.0, "S&T": 2.5, "Traction": 2.0}
TRAFFIC_DENSITY = {1: 8.5, 2: 9.0, 3: 7.5, 4: 7.0, 5: 6.0}


def _compute_risk_score(safe_crit, ov_days, dept, corr_id, spd_imp, wth_risk):
    """Compute AI Risk Score using spec formula: (Safety*3.0)+(OverdueDays*1.5)+DeptFactor."""
    dept_f = DEPT_FACTORS.get(dept, 1.5)
    traffic_d = TRAFFIC_DENSITY.get(corr_id, 7.0)
    spd_bonus = min(5.0, spd_imp / 8.0)
    raw = (safe_crit * 3.0) + (ov_days * 1.5) + dept_f + (traffic_d * 0.5) + spd_bonus - (wth_risk * 2.0)
    return round(min(100.0, max(0.0, raw)), 1)


def seed_trains(conn):
    """Insert daily train slots into train_schedules and legacy trains table."""
    c = conn.cursor()
    inserted = 0
    for t in TRAIN_SLOTS:
        (train_no, name, ttype, corr_id, origin, dest, dep, arr, days, priority, delay) = t
        try:
            c.execute(
                "INSERT OR IGNORE INTO train_schedules "
                "(train_no,name,train_type,corridor_id,origin_station,destination_station,"
                "departure_time,arrival_time,days_of_week,priority_score,avg_delay_min) "
                "VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                (train_no, name, ttype, corr_id, origin, dest, dep, arr, days, priority, delay),
            )
            if c.rowcount > 0:
                inserted += 1
                # Mirror to legacy trains table
                priority_label = "Critical" if priority >= 9.0 else "High" if priority >= 7.0 else "Normal"
                c.execute(
                    "INSERT OR IGNORE INTO trains "
                    "(train_no,name,type,corridor_id,departure_time,arrival_time,days_of_week,priority,avg_delay_min) "
                    "VALUES (?,?,?,?,?,?,?,?,?)",
                    (train_no, name, ttype, corr_id, dep, arr, days, priority_label, delay),
                )
        except Exception:
            continue
    conn.commit()
    return inserted


def seed_defects(conn):
    """Insert multi-department defect logs into unified_defects and maintenance_tasks."""
    c = conn.cursor()
    today = date.today()
    inserted = 0
    for d in DEFECT_LOGS:
        (task_code, title, desc, dept, dtype, gear_id, corr_id,
         km_s, km_e, dur_m, crit, urg, safe, ov_d, spd_imp, wth_risk) = d

        ai_score = _compute_risk_score(safe, ov_d, dept, corr_id, spd_imp, wth_risk)
        sch_date = str(today + timedelta(days=(ov_d % 7)))

        try:
            c.execute(
                "INSERT OR IGNORE INTO unified_defects "
                "(task_code,title,description,department,defect_type,gear_or_mast_id,corridor_id,"
                "km_start,km_end,required_duration_mins,criticality,urgency,safety_risk,overdue_days,"
                "speed_impact_kmh,weather_risk,ai_risk_score,status,scheduled_date,requested_by) "
                "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (task_code, title, desc, dept, dtype, gear_id, corr_id,
                 km_s, km_e, dur_m, crit, urg, safe, ov_d, spd_imp, wth_risk,
                 ai_score, "Pending", sch_date, "RailOpt Seeder"),
            )
            if c.rowcount > 0:
                inserted += 1
                # Mirror to maintenance_tasks
                c.execute(
                    "INSERT OR IGNORE INTO maintenance_tasks "
                    "(task_code,title,description,department,corridor_id,km_start,km_end,duration_hours,"
                    "criticality,urgency,safety_risk,overdue_days,train_impact,speed_impact_kmh,weather_risk,"
                    "priority_score,status,scheduled_date,requested_by) "
                    "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                    (task_code, title, desc, dept, corr_id, km_s, km_e,
                     round(dur_m / 60.0, 2), crit, urg, safe, ov_d,
                     int(spd_imp / 6), spd_imp, wth_risk, ai_score,
                     "Pending", sch_date, "RailOpt Seeder"),
                )
        except Exception:
            continue
    conn.commit()
    return inserted


def seed_block_plans(conn):
    """Insert pre-computed Mega-Block plans from the seeded defects."""
    c = conn.cursor()
    today = date.today()
    inserted = 0

    blocks = [
        ("MB-SEED-001", 2, f"{today} 01:00", f"{today} 05:00", 4.0, 1,
         '["Engineering", "S&T", "Traction"]',
         '["TMS-101", "SMMS-201", "TDMS-301"]',
         95.0, 0, 0.0, 450.0, 96.0, "Approved",
         "Km 122–126 Mega-Block: Rail Fracture + Point Machine + OHE Cantilever"),

        ("MB-SEED-002", 2, f"{today + timedelta(days=1)} 01:30", f"{today + timedelta(days=1)} 05:30", 4.0, 1,
         '["Engineering", "S&T", "Traction"]',
         '["TMS-103", "SMMS-205", "TDMS-033"]',
         91.0, 0, 0.0, 390.0, 93.0, "Approved",
         "Km 130–133 Mega-Block: Fishplate + Panel Wiring + Section Insulator"),

        ("MB-SEED-003", 2, f"{today + timedelta(days=2)} 02:00", f"{today + timedelta(days=2)} 07:00", 5.0, 1,
         '["Engineering", "S&T", "Traction"]',
         '["TMS-104", "SMMS-203", "TDMS-304"]',
         88.0, 0, 0.0, 420.0, 90.0, "Proposed",
         "Km 140–145 Mega-Block: Ballast + Axle Counter + OHE Stagger"),

        ("MB-SEED-004", 2, f"{today + timedelta(days=3)} 01:00", f"{today + timedelta(days=3)} 05:00", 4.0, 1,
         '["Engineering", "S&T", "Traction"]',
         '["TMS-106", "SMMS-204", "TDMS-305"]',
         92.5, 0, 0.0, 360.0, 94.0, "Proposed",
         "Km 155–158 Mega-Block: Switch Rail + Relay + Transformer"),
    ]

    for b in blocks:
        try:
            c.execute(
                "INSERT OR IGNORE INTO block_plans "
                "(block_code,corridor_id,start_time,end_time,duration_hours,"
                "is_mega_block,merged_departments,assigned_tasks,priority_score,"
                "train_conflicts,estimated_delay_min,calculated_downtime_saved_mins,"
                "block_utilization,status,reason) "
                "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                b,
            )
            if c.rowcount > 0:
                inserted += 1
        except Exception:
            continue
    conn.commit()
    return inserted


# ═══════════════════════════════════════════════════════════════════════════════
# CLI ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="RailOpt Seed Data Generator")
    parser.add_argument("--reset", action="store_true", help="Remove DB and re-create from scratch")
    args = parser.parse_args()

    if args.reset and os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print(f"[RESET] Removed database: {DB_PATH}")

    print("[INIT] Initializing database schema...")
    init_db()

    conn = get_db()
    try:
        n_trains  = seed_trains(conn)
        n_defects = seed_defects(conn)
        n_blocks  = seed_block_plans(conn)

        # Summary counts
        total_trains  = conn.execute("SELECT COUNT(*) FROM train_schedules").fetchone()[0]
        total_defects = conn.execute("SELECT COUNT(*) FROM unified_defects").fetchone()[0]
        total_blocks  = conn.execute("SELECT COUNT(*) FROM block_plans").fetchone()[0]
        depts = [r[0] for r in conn.execute("SELECT DISTINCT department FROM unified_defects").fetchall()]

        print(f"\n{'='*60}")
        print("  RailOpt Seed Complete")
        print(f"{'='*60}")
        print(f"  Trains inserted:   {n_trains:>3}  (total: {total_trains})")
        print(f"  Defects inserted:  {n_defects:>3}  (total: {total_defects})")
        print(f"  Mega-blocks:       {n_blocks:>3}  (total: {total_blocks})")
        print(f"  Departments:       {depts}")
        print(f"  Database:          {DB_PATH}")
        print(f"{'='*60}\n")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
