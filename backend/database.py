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
    _seed_extended(conn)
    conn.close()


# ─────────────────────────────────────────────────────────────────────────────
# PRIMARY SEED — baseline records (runs only when tables are empty)
# ─────────────────────────────────────────────────────────────────────────────

def _seed(conn):
    c = conn.cursor()

    # ── Default Users ────────────────────────────────────────────────────────
    c.execute("SELECT COUNT(*) FROM users")
    if c.fetchone()[0] == 0:
        users = [
            ("Rajesh Kumar",   "admin@railopt.in",  hash_password("admin123"), "admin",    "Engineering"),
            ("Priya Sharma",   "priya@railopt.in",  hash_password("pass123"),  "engineer", "S&T"),
            ("Amit Singh",     "amit@railopt.in",   hash_password("pass123"),  "engineer", "Traction"),
            ("Sunita Rao",     "sunita@railopt.in", hash_password("pass123"),  "manager",  "Engineering"),
            ("Vikram Mehta",   "vikram@railopt.in", hash_password("pass123"),  "engineer", "S&T"),
            ("Deepa Nair",     "deepa@railopt.in",  hash_password("pass123"),  "engineer", "Traction"),
        ]
        c.executemany("INSERT INTO users (name,email,password,role,department) VALUES (?,?,?,?,?)", users)

    # ── Corridors ─────────────────────────────────────────────────────────────
    c.execute("SELECT COUNT(*) FROM corridors")
    if c.fetchone()[0] == 0:
        corridors = [
            ("C1", "Mumbai–Pune Corridor",         "CSTM", "PUNE", 192.5, "CR",  "Mumbai Division"),
            ("C2", "Delhi–Agra Mainline",           "NDLS", "AGC",  200.2, "NCR", "Delhi Division"),
            ("C3", "Chennai–Bangalore Corridor",    "MAS",  "SBC",  362.0, "SR",  "Chennai Division"),
            ("C4", "Howrah–Patna Mainline",         "HWH",  "PNBE", 531.0, "ER",  "Howrah Division"),
            ("C5", "Ahmedabad–Vadodara Corridor",   "ADI",  "BRC",  98.7,  "WR",  "Ahmedabad Division"),
        ]
        c.executemany("INSERT INTO corridors (code,name,from_station,to_station,length_km,zone,section) VALUES (?,?,?,?,?,?,?)", corridors)

    # ── Assets ────────────────────────────────────────────────────────────────
    c.execute("SELECT COUNT(*) FROM assets")
    if c.fetchone()[0] == 0:
        assets = [
            ("AST001", "Track Section A – KM 120-130",  "Track",  2, 125.0, "Good",     "2026-07-01", "2026-09-01", 94.5, "High",     "Engineering"),
            ("AST002", "OHE Mast KM 125",               "OHE",    2, 125.0, "Fair",     "2026-06-15", "2026-08-15", 78.2, "Critical", "Traction"),
            ("AST003", "Signal Box SB-12",               "Signal", 2, 126.0, "Good",     "2026-07-20", "2026-09-20", 98.1, "High",     "S&T"),
            ("AST004", "Track Section B – KM 200-210",  "Track",  2, 205.0, "Poor",     "2026-05-01", "2026-07-01", 62.3, "Critical", "Engineering"),
            ("AST005", "Level Crossing LC-45",           "LC",     2, 145.0, "Good",     "2026-07-10", "2026-10-10", 99.0, "Medium",   "Engineering"),
            ("AST006", "Bridge BR-101",                  "Bridge", 4, 410.0, "Fair",     "2026-04-01", "2026-08-01", 72.0, "Critical", "Engineering"),
            ("AST007", "OHE Feeder Section KM 150-160", "OHE",    3, 155.0, "Good",     "2026-06-20", "2026-09-20", 91.0, "High",     "Traction"),
            ("AST008", "Point Machine PM-34",            "Signal", 1, 88.0,  "Fair",     "2026-07-05", "2026-09-05", 85.5, "High",     "S&T"),
        ]
        c.executemany("INSERT INTO assets (asset_code,name,type,corridor_id,km_location,condition,last_maintained,next_due,availability,criticality,department) VALUES (?,?,?,?,?,?,?,?,?,?,?)", assets)

    conn.commit()


# ─────────────────────────────────────────────────────────────────────────────
# EXTENDED SEED — 30+ trains, 20+ defects, 4 mega-blocks
# Runs when counts are below thresholds to be non-destructive
# ─────────────────────────────────────────────────────────────────────────────

def _seed_extended(conn):
    c = conn.cursor()

    # ── COA Train Timetables: 30+ trains across all 5 corridors ─────────────
    c.execute("SELECT COUNT(*) FROM train_schedules")
    train_count = c.fetchone()[0]

    if train_count < 30:
        # fmt: (train_no, name, train_type, corridor_id, origin, dest, dep_time, arr_time, days, priority_score, avg_delay)
        # Priority: Vande Bharat=10, Shatabdi=9.5, Rajdhani=9, Duronto=8.5, Superfast=7.5, Express=7, Mail=6, Intercity=5, Goods/Freight=3
        train_data = [
            # ── Corridor C1: Mumbai–Pune (CSTM→PUNE, 192 km) ───────────────
            ("22436", "Vande Bharat Express (Mumbai–Pune)",   "Vande Bharat", 1, "CSTM", "PUNE", "06:00", "08:40", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", 10.0, 1.5),
            ("12123", "Deccan Queen Express",                  "Superfast",    1, "CSTM", "PUNE", "07:15", "10:25", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  7.5, 2.5),
            ("12127", "Intercity SF Express",                  "Superfast",    1, "CSTM", "PUNE", "14:35", "17:25", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  7.5, 3.0),
            ("12139", "Sevagram Express",                      "Express",      1, "CSTM", "PUNE", "20:55", "00:35", "Mon,Wed,Fri,Sun",               7.0, 8.5),
            ("11007", "Deccan Express",                        "Express",      1, "CSTM", "PUNE", "17:10", "20:55", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  6.5, 5.0),
            ("01001", "Mumbai Mail",                           "Mail",         1, "CSTM", "PUNE", "23:55", "03:25", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  6.0, 10.0),
            ("BOXN-88", "Container Freight C1",                "Goods/Freight",1, "CSTM", "PUNE", "02:00", "05:00", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  3.0, 0.0),
            ("12952", "Mumbai Rajdhani Express",               "Rajdhani",     1, "MMCT", "NDLS", "16:55", "08:35", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  9.0, 4.0),

            # ── Corridor C2: Delhi–Agra Mainline (NDLS→AGC, 200 km) ────────
            ("22691", "Vande Bharat (Delhi–Agra)",             "Vande Bharat", 2, "NDLS", "AGC",  "06:00", "08:00", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", 10.0, 1.0),
            ("12002", "Bhopal Shatabdi Express",               "Shatabdi",     2, "NDLS", "BPL",  "06:15", "14:40", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  9.5, 3.0),
            ("12050", "Gatimaan Express",                       "Superfast",    2, "NDLS", "AGC",  "08:10", "09:50", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  8.0, 1.5),
            ("12165", "Ajmer Shatabdi Express",                 "Shatabdi",     2, "NDLS", "AII",  "06:05", "12:55", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  9.5, 2.5),
            ("12953", "August Kranti Rajdhani",                 "Rajdhani",     2, "NDLS", "MMCT", "17:40", "10:10", "Mon,Wed,Fri,Sat",              9.0, 6.0),
            ("12275", "Duronto Express (Delhi–Mumbai)",         "Duronto",      2, "NDLS", "MMCT", "23:00", "14:45", "Tue,Fri",                       8.5, 5.0),
            ("14311", "Ala Hazrat Express",                     "Express",      2, "BE",   "BAR",  "21:00", "09:30", "Mon,Fri",                       7.0, 15.0),
            ("BTPN-99", "Goods Freight Coal Corridor C2",       "Goods/Freight",2, "NDLS", "AGC",  "01:30", "04:30", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  3.0, 0.0),
            ("BCNA-77", "Container Freight JNPT C2",            "Goods/Freight",2, "NDLS", "GZB",  "03:00", "05:00", "Tue,Thu,Sat",                   3.0, 0.0),

            # ── Corridor C3: Chennai–Bangalore (MAS→SBC, 362 km) ───────────
            ("22027", "Chennai–SBC Vande Bharat",              "Vande Bharat", 3, "MAS",  "SBC",  "06:00", "10:30", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", 10.0, 1.5),
            ("12007", "Chennai Shatabdi",                       "Shatabdi",     3, "MAS",  "SBC",  "06:00", "11:00", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  9.5, 2.0),
            ("12657", "Chennai Mail",                           "Mail",         3, "MAS",  "SBC",  "21:45", "05:45", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  6.0, 12.0),
            ("16001", "Lalbagh Express",                        "Superfast",    3, "MAS",  "SBC",  "06:30", "12:05", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  7.5, 5.0),
            ("22625", "Double Decker Express",                  "Superfast",    3, "MAS",  "SBC",  "14:30", "20:00", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  7.5, 4.0),
            ("BOXN-63", "Goods Freight C3",                    "Goods/Freight",3, "MAS",  "SBC",  "02:30", "08:00", "Mon,Wed,Fri",                   3.0, 0.0),

            # ── Corridor C4: Howrah–Patna (HWH→PNBE, 531 km) ───────────────
            ("22823", "Vande Bharat (HWH–PNBE)",               "Vande Bharat", 4, "HWH",  "PNBE", "06:05", "11:30", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", 10.0, 2.0),
            ("12301", "Howrah Rajdhani Express",                "Rajdhani",     4, "HWH",  "NDLS", "16:55", "10:00", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  9.0, 5.5),
            ("12303", "Poorva Express",                         "Express",      4, "HWH",  "NDLS", "08:00", "20:45", "Mon,Wed,Fri",                   7.0, 12.0),
            ("13005", "Amrita Express",                         "Express",      4, "HWH",  "PNBE", "12:45", "20:35", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  6.5, 8.0),
            ("BCNA-44", "Goods Freight C4",                    "Goods/Freight",4, "HWH",  "PNBE", "01:00", "07:30", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  3.0, 0.0),

            # ── Corridor C5: Ahmedabad–Vadodara (ADI→BRC, 98 km) ───────────
            ("22957", "Vande Bharat (ADI–BRC)",                "Vande Bharat", 5, "ADI",  "BRC",  "07:00", "08:20", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", 10.0, 0.5),
            ("12009", "Shatabdi Express (ADI–MMCT)",            "Shatabdi",     5, "ADI",  "MMCT", "06:25", "12:55", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  9.5, 2.5),
            ("19011", "Gujarat Express",                        "Express",      5, "ADI",  "MMCT", "07:30", "15:45", "Mon,Tue,Wed,Thu,Fri,Sat,Sun",  6.5, 8.0),
            ("19015", "Saurashtra Express",                     "Express",      5, "ADI",  "BVC",  "20:05", "07:10", "Mon,Wed,Sat",                   6.5, 14.0),
            ("BOXN-55", "Goods Freight C5",                    "Goods/Freight",5, "ADI",  "BRC",  "03:30", "05:30", "Tue,Thu,Sat",                   3.0, 0.0),
        ]

        c.executemany(
            "INSERT OR IGNORE INTO train_schedules (train_no,name,train_type,corridor_id,origin_station,destination_station,departure_time,arrival_time,days_of_week,priority_score,avg_delay_min) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            train_data
        )
        c.executemany(
            "INSERT OR IGNORE INTO trains (train_no,name,type,corridor_id,departure_time,arrival_time,days_of_week,priority,avg_delay_min) VALUES (?,?,?,?,?,?,?,?,?)",
            [(t[0], t[1], t[2], t[3], t[6], t[7], t[8], "Critical" if float(t[9]) >= 9.0 else "High" if float(t[9]) >= 7.0 else "Normal", t[10]) for t in train_data]
        )

    # ── Unified Defects: 20+ multi-department defect logs ─────────────────
    c.execute("SELECT COUNT(*) FROM unified_defects")
    defect_count = c.fetchone()[0]

    if defect_count < 20:
        today = date.today()
        # fmt: (task_code, title, description, department, defect_type, gear_id, corridor_id,
        #        km_start, km_end, dur_mins, criticality, urgency, safety_risk, overdue_days,
        #        speed_impact, weather_risk, scheduled_date, requested_by)
        defects = [
            # ── TMS – Engineering (Track Maintenance System) ────────────────
            ("TMS-101", "Rail Fracture Defect & Joint Inspection",
             "Micro-crack detected on head of 60kg rail via USFD Ultrasonic Testing",
             "Engineering", "Rail Fracture",           "TRK-122",  2, 120.0, 135.0, 210, 10, 9, 10,  8, 30.0, 0.1, str(today),                    "Rajesh Kumar"),
            ("TMS-102", "Track Geometry Tamping & Alignment",
             "Deep ballast tamping and gauge correction required across section",
             "Engineering", "Track Geometry Correction","TRK-203",  2, 122.0, 128.0, 180,  7, 8,  7,  3, 15.0, 0.0, str(today + timedelta(days=1)), "Sunita Rao"),
            ("TMS-103", "Bridge BR-101 Deflection Inspection",
             "Fatigue testing and structural inspection on major girder bridge",
             "Engineering", "Bridge Inspection",       "BR-101",   4, 408.0, 412.0, 240,  9, 8,  9, 12, 20.0, 0.2, str(today - timedelta(days=2)), "Rajesh Kumar"),
            ("TMS-104", "Fishplate & Joint Bolt Tightening",
             "Loose fishplate joints detected at km 88-95, risk of rail spread",
             "Engineering", "Fishplate Repair",        "TRK-088",  1,  88.0,  95.0, 120,  8, 8,  9,  6, 20.0, 0.0, str(today - timedelta(days=1)), "Sunita Rao"),
            ("TMS-105", "Ballast Renewal & Shoulder Cleaning",
             "Ballast fouling index exceeds 40%, drainage impaired",
             "Engineering", "Ballast Renewal",         "TRK-340",  3, 340.0, 355.0, 300,  7, 6,  7,  0, 10.0, 0.3, str(today + timedelta(days=2)), "Rajesh Kumar"),
            ("TMS-106", "Level Crossing Gate Mechanism Overhaul",
             "Interlocking gate mechanism stiff, motor overload alarm triggered",
             "Engineering", "LC Gate Repair",          "LC-045",   2, 145.0, 146.0,  90,  6, 7,  8,  4,  5.0, 0.0, str(today - timedelta(days=4)), "Sunita Rao"),
            ("TMS-107", "Derailment Guard Rail Installation",
             "Guard rail installation at high-speed turnout approach zone",
             "Engineering", "Guard Rail Installation", "TRK-175",  4, 175.0, 177.0, 180,  8, 7,  9,  0, 25.0, 0.1, str(today + timedelta(days=3)), "Rajesh Kumar"),
            ("TMS-108", "Track Renewal KM 490-495",
             "Worn out 52kg rails to be replaced with 60kg UIC rails",
             "Engineering", "Track Renewal",           "TRK-490",  4, 490.0, 495.0, 480, 10, 9, 10, 20, 40.0, 0.0, str(today - timedelta(days=5)), "Sunita Rao"),

            # ── SMMS – S&T (Signalling & Measurement Maintenance System) ────
            ("SMMS-201", "Point Machine Overhaul & Motor Check",
             "Point machine switch overhaul and lock bar calibration",
             "S&T", "Point Machine Overhaul", "PT-124",  2, 122.0, 126.0, 120,  8, 8,  8,  2, 10.0, 0.0, str(today + timedelta(days=1)), "Priya Sharma"),
            ("SMMS-202", "Track Circuit Audio Frequency Glitch",
             "AFTC track circuit bond wire replacement and frequency tuning",
             "S&T", "Track Circuit Fault",    "TC-125",  2, 124.0, 128.0,  90,  7, 7,  8,  0,  5.0, 0.0, str(today + timedelta(days=1)), "Priya Sharma"),
            ("SMMS-203", "Signal Relay Overhaul SB-33",
             "Signal relay room interlocking testing and aspect lamp replacement",
             "S&T", "Relay Overhaul",         "SB-33",   4, 413.0, 417.0, 180,  9, 9,  9, 15, 15.0, 0.1, str(today - timedelta(days=5)), "Priya Sharma"),
            ("SMMS-204", "Axle Counter Calibration & Reset",
             "Axle counter fail-safe mode triggered — recalibration needed",
             "S&T", "Axle Counter Fault",     "AXC-310", 3, 310.0, 315.0,  90,  9, 9,  9,  3, 20.0, 0.0, str(today - timedelta(days=2)), "Vikram Mehta"),
            ("SMMS-205", "BPAC Panel Wiring Inspection",
             "Block panel indication lamp intermittent — wiring loom check",
             "S&T", "Panel Wiring Fault",     "SB-12",   1,  80.0,  82.0,  60,  6, 6,  7,  0,  0.0, 0.0, str(today + timedelta(days=2)), "Priya Sharma"),
            ("SMMS-206", "Telecom OFC Cable Splice Repair",
             "Optical fibre cable cut detected at km 96, communication disrupted",
             "S&T", "OFC Cable Repair",       "OFC-096", 5,  96.0,  98.0, 120,  8, 8,  7,  1,  0.0, 0.0, str(today),                    "Vikram Mehta"),
            ("SMMS-207", "Interlocking Stick Circuit Testing",
             "Stick relay contact check for signal 2A on up main line",
             "S&T", "Interlocking Test",      "SB-44",   2, 156.0, 158.0,  60,  7, 7,  8,  0, 10.0, 0.0, str(today + timedelta(days=1)), "Priya Sharma"),

            # ── TDMS – Traction (Traction Distribution Maintenance System) ──
            ("TDMS-301", "OHE Cantilever Alignment & Contact Wire",
             "Overhead contact wire height & stagger adjustment near mast 125/12",
             "Traction", "Cantilever Alignment",   "OHE-125",  2, 123.0, 130.0, 240,  8, 9,  9,  5, 20.0, 0.1, str(today + timedelta(days=1)), "Amit Singh"),
            ("TDMS-302", "Vegetation Clearance near OHE Feeder",
             "Tree branch trimming near 25kV feeder wire to prevent tripping",
             "Traction", "Vegetation Clearance",   "OHE-128",  2, 126.0, 132.0, 120,  6, 7,  7,  1,  0.0, 0.3, str(today + timedelta(days=2)), "Amit Singh"),
            ("TDMS-303", "Booster Transformer Replacement BT-07",
             "Replacement of damaged 25kV booster transformer",
             "Traction", "Transformer Overhaul",   "BT-07",    4, 415.0, 420.0, 210,  9, 9,  9, 10, 25.0, 0.0, str(today - timedelta(days=3)), "Amit Singh"),
            ("TDMS-304", "Section Insulator Replacement SI-33",
             "Worn section insulator causing arc flash at km 88.5",
             "Traction", "Section Insulator Fault","SI-088",   1,  88.0,  90.0, 150,  9, 9, 10,  7, 30.0, 0.0, str(today - timedelta(days=2)), "Deepa Nair"),
            ("TDMS-305", "Earth Fault on 25kV Feeder F-04",
             "Earth leakage detected on feeder cable near sub-station SS-05",
             "Traction", "Earth Fault",            "SS-05",    3, 280.0, 285.0, 180,  9, 8,  9,  4, 20.0, 0.0, str(today - timedelta(days=1)), "Deepa Nair"),
            ("TDMS-306", "OHE Stagger Correction KM 340-345",
             "Contact wire stagger out of limit — risk of pantograph dewirement",
             "Traction", "OHE Stagger Correction", "OHE-340",  3, 340.0, 345.0, 120,  8, 8,  9,  2, 15.0, 0.2, str(today + timedelta(days=1)), "Amit Singh"),
            ("TDMS-307", "AT Feeding System Inspection",
             "Auto-transformer tap changer mechanical wear — vibration alarm",
             "Traction", "AT System Inspection",   "AT-062",   5,  60.0,  65.0, 180,  7, 7,  8,  0,  5.0, 0.0, str(today + timedelta(days=3)), "Deepa Nair"),
        ]

        for df in defects:
            (task_code, title, desc, dept, dtype, gear_id, corr_id, km_s, km_e,
             dur_m, crit, urg, safe, ov_d, spd_imp, wth_risk, sch_dt, req_by) = df

            # AI Risk Score formula (spec: Safety*3.0 + OverdueDays*1.5 + DeptFactor)
            dept_factors = {"Engineering": 3.0, "S&T": 2.5, "Traction": 2.0}
            dept_f = dept_factors.get(dept, 1.5)
            traffic_d = {1: 8.5, 2: 9.0, 3: 7.5, 4: 7.0, 5: 6.0}.get(corr_id, 7.0)
            spd_bonus = min(5.0, spd_imp / 8.0)
            ai_score = round(
                min(100.0, max(0.0,
                    (safe * 3.0) + (ov_d * 1.5) + dept_f + (traffic_d * 0.5) + spd_bonus - (wth_risk * 2.0)
                )), 1
            )

            c.execute("""
            INSERT OR IGNORE INTO unified_defects
            (task_code,title,description,department,defect_type,gear_or_mast_id,corridor_id,
             km_start,km_end,required_duration_mins,criticality,urgency,safety_risk,overdue_days,
             speed_impact_kmh,weather_risk,ai_risk_score,status,scheduled_date,requested_by)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (task_code, title, desc, dept, dtype, gear_id, corr_id, km_s, km_e,
                  dur_m, crit, urg, safe, ov_d, spd_imp, wth_risk, ai_score,
                  "Pending", sch_dt, req_by))

            # Also seed maintenance_tasks for legacy compatibility
            c.execute("""
            INSERT OR IGNORE INTO maintenance_tasks
            (task_code,title,description,department,corridor_id,km_start,km_end,duration_hours,
             criticality,urgency,safety_risk,overdue_days,train_impact,speed_impact_kmh,weather_risk,priority_score,status,scheduled_date,requested_by)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (task_code, title, desc, dept, corr_id, km_s, km_e,
                  round(dur_m / 60.0, 2), crit, urg, safe, ov_d,
                  int(spd_imp / 6), spd_imp, wth_risk, ai_score,
                  "Pending", sch_dt, req_by))

    # ── Block Plans (Mega-Blocks) ──────────────────────────────────────────
    c.execute("SELECT COUNT(*) FROM block_plans")
    block_count = c.fetchone()[0]

    if block_count < 4:
        today = date.today()
        blocks = [
            ("MB-2026-081", 2, f"{today} 01:00", f"{today} 05:00", 4.0, 1,
             '["Engineering", "S&T", "Traction"]',
             '["TMS-101", "SMMS-201", "TDMS-301"]',
             94.2, 0, 0.0, 450.0, 96.0, "Approved",
             "Consolidated Shadow Mega-Block merging TMS Rail Fracture, SMMS Point Machine, and TDMS Cantilever Alignment into 1 single possession window"),
            ("MB-2026-082", 4, f"{today + timedelta(days=1)} 02:00", f"{today + timedelta(days=1)} 06:00", 4.0, 1,
             '["Engineering", "S&T", "Traction"]',
             '["TMS-103", "SMMS-203", "TDMS-303"]',
             91.5, 0, 0.0, 390.0, 92.0, "Approved",
             "Night Mega-Block for Bridge BR-101 and Signal Relay SB-33 overhaul"),
            ("MB-2026-083", 1, f"{today + timedelta(days=2)} 01:30", f"{today + timedelta(days=2)} 05:30", 4.0, 1,
             '["Engineering", "S&T", "Traction"]',
             '["TMS-104", "SMMS-205", "TDMS-304"]',
             89.8, 0, 0.0, 360.0, 90.0, "Proposed",
             "Shadow Mega-Block: C1 Mumbai corridor fishplate, panel wiring, and section insulator tasks consolidated"),
            ("MB-2026-084", 3, f"{today + timedelta(days=3)} 02:00", f"{today + timedelta(days=3)} 07:00", 5.0, 1,
             '["Engineering", "S&T", "Traction"]',
             '["TMS-105", "SMMS-204", "TDMS-305", "TDMS-306"]',
             88.5, 0, 0.0, 420.0, 88.0, "Proposed",
             "C3 Chennai corridor Mega-Block: ballast renewal, axle counter reset, and earth fault rectification"),
        ]
        c.executemany(
            """INSERT OR IGNORE INTO block_plans (block_code,corridor_id,start_time,end_time,duration_hours,
               is_mega_block,merged_departments,assigned_tasks,priority_score,train_conflicts,
               estimated_delay_min,calculated_downtime_saved_mins,block_utilization,status,reason)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            blocks
        )
        c.executemany(
            """INSERT OR IGNORE INTO blocks (block_code,corridor_id,start_time,end_time,duration_hours,
               departments,task_ids,priority_score,train_conflicts,estimated_delay_min,
               block_utilization,status,ai_generated,reason) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            [(b[0], b[1], b[2], b[3], b[4], ", ".join(eval(b[6])), b[7].replace('"', '').replace('[', '').replace(']', ''),
              b[8], b[9], b[10], b[12], b[13], 1, b[14]) for b in blocks]
        )

    # ── Weekly plans ─────────────────────────────────────────────────────────
    c.execute("SELECT COUNT(*) FROM weekly_plans")
    if c.fetchone()[0] < 4:
        today_dt = date.today()
        monday = today_dt - timedelta(days=today_dt.weekday())
        week_start = str(monday)
        plans = [
            (week_start, 1, 0, "Approved Mega-Block – TMS + SMMS + TDMS (C2 Delhi–Agra)"),
            (week_start, 2, 2, "Approved Mega-Block – Night Bridge & Relay Overhaul (C4 HWH–Patna)"),
            (week_start, 3, 4, "Proposed Mega-Block – C1 Mumbai Corridor Shadow Block"),
            (week_start, 4, 5, "Proposed Mega-Block – C3 Chennai Corridor Consolidation"),
        ]
        c.executemany("INSERT OR IGNORE INTO weekly_plans (week_start,block_id,day_of_week,notes) VALUES (?,?,?,?)", plans)

    conn.commit()
