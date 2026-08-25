import sqlite3
import hashlib
import os
from datetime import datetime, date, timedelta
import random

DB_PATH = os.path.join(os.path.dirname(__file__), "railopt.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def init_db():
    conn = get_db()
    c = conn.cursor()

    # ── Users ────────────────────────────────────────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT NOT NULL,
        email       TEXT UNIQUE NOT NULL,
        password    TEXT NOT NULL,
        role        TEXT DEFAULT 'engineer',
        department  TEXT DEFAULT 'Engineering',
        created_at  TEXT DEFAULT (datetime('now'))
    )""")

    # ── Corridors ────────────────────────────────────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS corridors (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        code        TEXT UNIQUE NOT NULL,
        name        TEXT NOT NULL,
        from_station TEXT NOT NULL,
        to_station  TEXT NOT NULL,
        length_km   REAL,
        zone        TEXT,
        section     TEXT
    )""")

    # ── Assets ────────────────────────────────────────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS assets (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_code      TEXT UNIQUE NOT NULL,
        name            TEXT NOT NULL,
        type            TEXT NOT NULL,
        corridor_id     INTEGER,
        km_location     REAL,
        condition       TEXT DEFAULT 'Good',
        last_maintained TEXT,
        next_due        TEXT,
        availability    REAL DEFAULT 100.0,
        criticality     TEXT DEFAULT 'Medium',
        department      TEXT
    )""")

    # ── COA Train Timetables (train_schedules) ──────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS train_schedules (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        train_no            TEXT UNIQUE NOT NULL,
        name                TEXT NOT NULL,
        train_type          TEXT NOT NULL,
        corridor_id         INTEGER NOT NULL,
        origin_station      TEXT NOT NULL,
        destination_station TEXT NOT NULL,
        departure_time      TEXT NOT NULL,
        arrival_time        TEXT NOT NULL,
        days_of_week        TEXT NOT NULL,
        priority_score      REAL DEFAULT 5.0,
        avg_delay_min       REAL DEFAULT 0.0,
        FOREIGN KEY (corridor_id) REFERENCES corridors(id)
    )""")

    # Standard compatibility view/table for legacy "trains"
    c.execute("""
    CREATE TABLE IF NOT EXISTS trains (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        train_no        TEXT UNIQUE NOT NULL,
        name            TEXT NOT NULL,
        type            TEXT NOT NULL,
        corridor_id     INTEGER,
        departure_time  TEXT,
        arrival_time    TEXT,
        days_of_week    TEXT,
        priority        TEXT DEFAULT 'Normal',
        avg_delay_min   REAL DEFAULT 0
    )""")

    # ── Departmental Defect Logs (unified_defects & maintenance_tasks) ──────
    c.execute("""
    CREATE TABLE IF NOT EXISTS unified_defects (
        id                     INTEGER PRIMARY KEY AUTOINCREMENT,
        task_code              TEXT UNIQUE NOT NULL,
        title                  TEXT NOT NULL,
        description            TEXT,
        department             TEXT NOT NULL,
        defect_type            TEXT,
        gear_or_mast_id        TEXT,
        corridor_id            INTEGER NOT NULL,
        km_start               REAL NOT NULL,
        km_end                 REAL NOT NULL,
        required_duration_mins REAL NOT NULL,
        criticality            INTEGER DEFAULT 5,
        urgency                INTEGER DEFAULT 5,
        safety_risk            INTEGER DEFAULT 5,
        overdue_days           INTEGER DEFAULT 0,
        speed_impact_kmh       REAL DEFAULT 0.0,
        weather_risk           REAL DEFAULT 0.0,
        ai_risk_score          REAL DEFAULT 0.0,
        status                 TEXT DEFAULT 'Pending',
        scheduled_date         TEXT,
        created_at             TEXT DEFAULT (datetime('now')),
        requested_by           TEXT,
        FOREIGN KEY (corridor_id) REFERENCES corridors(id)
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS maintenance_tasks (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        task_code       TEXT UNIQUE NOT NULL,
        title           TEXT NOT NULL,
        description     TEXT,
        department      TEXT NOT NULL,
        asset_id        INTEGER,
        corridor_id     INTEGER,
        km_start        REAL,
        km_end          REAL,
        duration_hours  REAL NOT NULL,
        criticality     INTEGER DEFAULT 5,
        urgency         INTEGER DEFAULT 5,
        safety_risk     INTEGER DEFAULT 5,
        overdue_days    INTEGER DEFAULT 0,
        train_impact    INTEGER DEFAULT 5,
        speed_impact_kmh REAL DEFAULT 0.0,
        weather_risk    REAL DEFAULT 0.0,
        priority_score  REAL DEFAULT 0,
        status          TEXT DEFAULT 'Pending',
        scheduled_date  TEXT,
        created_at      TEXT DEFAULT (datetime('now')),
        requested_by    TEXT
    )""")

    # ── Optimized Blocks & Mega-Block Plans ──────────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS block_plans (
        id                             INTEGER PRIMARY KEY AUTOINCREMENT,
        block_code                     TEXT UNIQUE NOT NULL,
        corridor_id                    INTEGER NOT NULL,
        start_time                     TEXT NOT NULL,
        end_time                       TEXT NOT NULL,
        duration_hours                 REAL NOT NULL,
        is_mega_block                  INTEGER DEFAULT 1,
        merged_departments             TEXT NOT NULL,
        assigned_tasks                 TEXT NOT NULL,
        priority_score                 REAL DEFAULT 0.0,
        train_conflicts                INTEGER DEFAULT 0,
        estimated_delay_min            REAL DEFAULT 0.0,
        calculated_downtime_saved_mins REAL DEFAULT 0.0,
        block_utilization              REAL DEFAULT 0.0,
        status                         TEXT DEFAULT 'Proposed',
        reason                         TEXT,
        created_at                     TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (corridor_id) REFERENCES corridors(id)
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS blocks (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        block_code          TEXT UNIQUE NOT NULL,
        corridor_id         INTEGER,
        start_time          TEXT NOT NULL,
        end_time            TEXT NOT NULL,
        duration_hours      REAL,
        departments         TEXT,
        task_ids            TEXT,
        priority_score      REAL,
        train_conflicts     INTEGER DEFAULT 0,
        estimated_delay_min REAL DEFAULT 0,
        block_utilization   REAL DEFAULT 0,
        status              TEXT DEFAULT 'Proposed',
        ai_generated        INTEGER DEFAULT 1,
        created_at          TEXT DEFAULT (datetime('now')),
        reason              TEXT
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS weekly_plans (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        week_start  TEXT NOT NULL,
        block_id    INTEGER,
        day_of_week INTEGER,
        notes       TEXT
    )""")

    conn.commit()
    _seed(conn)
    conn.close()


def _seed(conn):
    c = conn.cursor()

    # ── Default Users ────────────────────────────────────────────────────────
    c.execute("SELECT COUNT(*) FROM users")
    if c.fetchone()[0] == 0:
        users = [
            ("Rajesh Kumar", "admin@railopt.in", hash_password("admin123"), "admin", "Engineering"),
            ("Priya Sharma", "priya@railopt.in", hash_password("pass123"), "engineer", "S&T"),
            ("Amit Singh", "amit@railopt.in", hash_password("pass123"), "engineer", "Traction"),
            ("Sunita Rao", "sunita@railopt.in", hash_password("pass123"), "manager", "Engineering"),
        ]
        c.executemany("INSERT INTO users (name,email,password,role,department) VALUES (?,?,?,?,?)", users)

    # ── Corridors ─────────────────────────────────────────────────────────────
    c.execute("SELECT COUNT(*) FROM corridors")
    if c.fetchone()[0] == 0:
        corridors = [
            ("C1", "Mumbai–Pune Corridor", "CSTM", "PUNE", 192.5, "CR", "Mumbai Division"),
            ("C2", "Delhi–Agra Mainline", "NDLS", "AGC", 200.2, "NCR", "Delhi Division"),
            ("C3", "Chennai–Bangalore Corridor", "MAS", "SBC", 362.0, "SR", "Chennai Division"),
            ("C4", "Howrah–Patna Mainline", "HWH", "PNBE", 531.0, "ER", "Howrah Division"),
            ("C5", "Ahmedabad–Vadodara Corridor", "ADI", "BRC", 98.7, "WR", "Ahmedabad Division"),
        ]
        c.executemany("INSERT INTO corridors (code,name,from_station,to_station,length_km,zone,section) VALUES (?,?,?,?,?,?,?)", corridors)

    # ── Assets ────────────────────────────────────────────────────────────────
    c.execute("SELECT COUNT(*) FROM assets")
    if c.fetchone()[0] == 0:
        assets = [
            ("AST001", "Track Section A – KM 120-130", "Track", 2, 125.0, "Good", "2026-07-01", "2026-09-01", 94.5, "High", "Engineering"),
            ("AST002", "OHE Mast KM 125", "OHE", 2, 125.0, "Fair", "2026-06-15", "2026-08-15", 78.2, "Critical", "Traction"),
            ("AST003", "Signal Box SB-12", "Signal", 2, 126.0, "Good", "2026-07-20", "2026-09-20", 98.1, "High", "S&T"),
            ("AST004", "Track Section B – KM 200-210", "Track", 2, 205.0, "Poor", "2026-05-01", "2026-07-01", 62.3, "Critical", "Engineering"),
            ("AST005", "Level Crossing LC-45", "LC", 2, 145.0, "Good", "2026-07-10", "2026-10-10", 99.0, "Medium", "Engineering"),
        ]
        c.executemany("INSERT INTO assets (asset_code,name,type,corridor_id,km_location,condition,last_maintained,next_due,availability,criticality,department) VALUES (?,?,?,?,?,?,?,?,?,?,?)", assets)

    # ── COA Train Timetables (train_schedules & trains) ─────────────────────
    c.execute("SELECT COUNT(*) FROM train_schedules")
    if c.fetchone()[0] == 0:
        train_data = [
            ("22436", "Vande Bharat Express", "Vande Bharat", 2, "NDLS", "BSB", "06:00", "14:00", "Mon,Tue,Wed,Fri,Sat,Sun", 10.0, 1.5),
            ("12002", "Bhopal Shatabdi Express", "Shatabdi", 2, "NDLS", "RKM", "06:15", "14:40", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", 9.5, 3.0),
            ("12952", "Mumbai Rajdhani Express", "Rajdhani", 1, "MMCT", "NDLS", "16:55", "08:35", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", 9.0, 4.0),
            ("12123", "Deccan Queen Express", "Superfast", 1, "CSTM", "PUNE", "07:15", "10:25", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", 7.5, 2.5),
            ("12027", "Chennai Bangalore Shatabdi", "Shatabdi", 3, "MAS", "SBC", "06:00", "11:00", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", 9.0, 2.0),
            ("12303", "Poorva Express", "Express", 4, "HWH", "NDLS", "08:00", "20:45", "Mon,Wed,Fri", 7.0, 12.0),
            ("19011", "Gujarat Express", "Express", 5, "ADI", "MMCT", "07:30", "15:45", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", 6.5, 8.0),
            ("BTPN-99", "Goods Freight Coal Corridor Forecast", "Goods/Freight", 2, "NDLS", "AGC", "01:30", "04:30", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", 3.0, 0.0),
            ("BOXN-88", "Container Freight Logistics Line", "Goods/Freight", 1, "CSTM", "PUNE", "02:00", "05:00", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", 3.0, 0.0),
        ]
        c.executemany(
            "INSERT INTO train_schedules (train_no,name,train_type,corridor_id,origin_station,destination_station,departure_time,arrival_time,days_of_week,priority_score,avg_delay_min) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            train_data
        )
        c.executemany(
            "INSERT INTO trains (train_no,name,type,corridor_id,departure_time,arrival_time,days_of_week,priority,avg_delay_min) VALUES (?,?,?,?,?,?,?,?,?)",
            [(t[0], t[1], t[2], t[3], t[6], t[7], t[8], "Critical" if float(t[9]) >= 9.0 else "High", t[10]) for t in train_data]
        )

    # ── Unified Defects (TMS, SMMS, TDMS) ───────────────────────────────────
    c.execute("SELECT COUNT(*) FROM unified_defects")
    if c.fetchone()[0] == 0:
        today = date.today()
        defects = [
            # TMS (Engineering)
            ("TMS-101", "Rail Fracture Defect & Joint Inspection", "Micro-crack detected on head of 60kg rail via USFD Ultrasonic Testing", "Engineering", "Rail Fracture", "TRK-122", 2, 120.0, 135.0, 210, 10, 9, 10, 8, 30.0, 0.1, str(today), "Rajesh Kumar"),
            ("TMS-102", "Track Geometry Tamping & Alignment", "Deep ballast tamping and gauge correction required across section", "Engineering", "Track Geometry Correction", "TRK-203", 2, 122.0, 128.0, 180, 7, 8, 7, 3, 15.0, 0.0, str(today + timedelta(days=1)), "Sunita Rao"),
            ("TMS-103", "Bridge BR-101 Deflection Inspection", "Fatigue testing and structural inspection on major girder bridge", "Engineering", "Bridge Inspection", "BR-101", 4, 408.0, 412.0, 240, 9, 8, 9, 12, 20.0, 0.2, str(today - timedelta(days=2)), "Rajesh Kumar"),

            # SMMS (Signalling & Telecom)
            ("SMMS-201", "Point Machine Overhaul & Motor Check", "Point machine switch overhaul and lock bar calibration", "S&T", "Point Machine Overhaul", "PT-124", 2, 122.0, 126.0, 120, 8, 8, 8, 2, 10.0, 0.0, str(today + timedelta(days=1)), "Priya Sharma"),
            ("SMMS-202", "Track Circuit Audio Frequency Glitch", "AFTC track circuit bond wire replacement and frequency tuning", "S&T", "Track Circuit Fault", "TC-125", 2, 124.0, 128.0, 90, 7, 7, 8, 0, 5.0, 0.0, str(today + timedelta(days=1)), "Priya Sharma"),
            ("SMMS-203", "Signal Relay Overhaul SB-33", "Signal relay room interlocking testing and aspect lamp replacement", "S&T", "Relay Overhaul", "SB-33", 4, 413.0, 417.0, 180, 9, 9, 9, 15, 15.0, 0.1, str(today - timedelta(days=5)), "Priya Sharma"),

            # TDMS (Traction / Power)
            ("TDMS-301", "OHE Cantilever Alignment & Contact Wire", "Overhead contact wire height & stagger adjustment near mast 125/12", "Traction", "Cantilever Alignment", "OHE-125", 2, 123.0, 130.0, 240, 8, 9, 9, 5, 20.0, 0.1, str(today + timedelta(days=1)), "Amit Singh"),
            ("TDMS-302", "Vegetation Clearance near OHE Feeder", "Tree branch trimming near 25kV feeder wire to prevent tripping", "Traction", "Vegetation Clearance", "OHE-128", 2, 126.0, 132.0, 120, 6, 7, 7, 1, 0.0, 0.3, str(today + timedelta(days=2)), "Amit Singh"),
            ("TDMS-303", "Booster Transformer Replacement BT-07", "Replacement of damaged 25kV booster transformer", "Traction", "Transformer Overhaul", "BT-07", 4, 415.0, 420.0, 210, 9, 9, 9, 10, 25.0, 0.0, str(today - timedelta(days=3)), "Amit Singh"),
        ]

        for df in defects:
            task_code, title, desc, dept, dtype, gear_id, corr_id, km_s, km_e, dur_m, crit, urg, safe, ov_d, spd_imp, wth_risk, sch_dt, req_by = df
            # Calculate AI Risk Score Formula:
            ov_score = min(10.0, (ov_d / 6.0) * 10.0)
            spd_score = min(10.0, (spd_imp / 30.0) * 10.0)
            ai_score = round(0.35 * crit + 0.25 * urg + 0.20 * safe + 0.10 * ov_score + 0.10 * spd_score - 0.05 * wth_risk, 2)

            c.execute("""
            INSERT INTO unified_defects
            (task_code,title,description,department,defect_type,gear_or_mast_id,corridor_id,
             km_start,km_end,required_duration_mins,criticality,urgency,safety_risk,overdue_days,
             speed_impact_kmh,weather_risk,ai_risk_score,status,scheduled_date,requested_by)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (task_code, title, desc, dept, dtype, gear_id, corr_id, km_s, km_e, dur_m, crit, urg, safe, ov_d, spd_imp, wth_risk, ai_score, "Pending", sch_dt, req_by))

            # Also seed maintenance_tasks for legacy compatibility (19 bindings)
            c.execute("""
            INSERT INTO maintenance_tasks
            (task_code,title,description,department,corridor_id,km_start,km_end,duration_hours,
             criticality,urgency,safety_risk,overdue_days,train_impact,speed_impact_kmh,weather_risk,priority_score,status,scheduled_date,requested_by)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (task_code, title, desc, dept, corr_id, km_s, km_e, round(dur_m / 60.0, 2), crit, urg, safe, ov_d, int(spd_imp / 6), spd_imp, wth_risk, ai_score, "Pending", sch_dt, req_by))

    # ── Block Plans (Mega-Blocks) ──────────────────────────────────────────
    c.execute("SELECT COUNT(*) FROM block_plans")
    if c.fetchone()[0] == 0:
        blocks = [
            ("MB-2026-081", 2, "2026-08-25 01:00", "2026-08-25 05:00", 4.0, 1, '["Engineering", "S&T", "Traction"]', '["TMS-101", "SMMS-201", "TDMS-301"]', 94.2, 0, 0.0, 450.0, 96.0, "Approved", "Consolidated Shadow Mega-Block merging TMS Rail Fracture, SMMS Point Machine, and TDMS Cantilever Alignment into 1 single possession window"),
            ("MB-2026-082", 4, "2026-08-26 02:00", "2026-08-26 06:00", 4.0, 1, '["Engineering", "S&T", "Traction"]', '["TMS-103", "SMMS-203", "TDMS-303"]', 91.5, 0, 0.0, 390.0, 92.0, "Approved", "Night Mega-Block for Bridge BR-101 and Signal Relay SB-33 overhaul"),
        ]
        c.executemany(
            """INSERT INTO block_plans (block_code,corridor_id,start_time,end_time,duration_hours,
               is_mega_block,merged_departments,assigned_tasks,priority_score,train_conflicts,
               estimated_delay_min,calculated_downtime_saved_mins,block_utilization,status,reason)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            blocks
        )
        c.executemany(
            """INSERT INTO blocks (block_code,corridor_id,start_time,end_time,duration_hours,
               departments,task_ids,priority_score,train_conflicts,estimated_delay_min,
               block_utilization,status,ai_generated,reason) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            [(b[0], b[1], b[2], b[3], b[4], "Engineering, S&T, Traction", "1,2,3", b[8], b[9], b[10], b[12], b[13], 1, b[14]) for b in blocks]
        )

    # ── Weekly plans ─────────────────────────────────────────────────────────
    c.execute("SELECT COUNT(*) FROM weekly_plans")
    if c.fetchone()[0] == 0:
        today = date.today()
        monday = today - timedelta(days=today.weekday())
        week_start = str(monday)
        plans = [
            (week_start, 1, 0, "Approved Mega-Block – TMS + SMMS + TDMS"),
            (week_start, 2, 2, "Approved Mega-Block – Night Bridge & Relay Overhaul"),
        ]
        c.executemany("INSERT INTO weekly_plans (week_start,block_id,day_of_week,notes) VALUES (?,?,?,?)", plans)

    conn.commit()
