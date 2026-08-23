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

    # ── Trains ────────────────────────────────────────────────────────────────
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

    # ── Maintenance Tasks ─────────────────────────────────────────────────────
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
        priority_score  REAL DEFAULT 0,
        status          TEXT DEFAULT 'Pending',
        scheduled_date  TEXT,
        created_at      TEXT DEFAULT (datetime('now')),
        requested_by    TEXT
    )""")

    # ── Blocks ────────────────────────────────────────────────────────────────
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

    # ── Weekly Plans ─────────────────────────────────────────────────────────
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

    # ── Default admin user ────────────────────────────────────────────────────
    c.execute("SELECT COUNT(*) FROM users")
    if c.fetchone()[0] == 0:
        users = [
            ("Rajesh Kumar", "admin@railopt.in", hash_password("admin123"), "admin", "Engineering"),
            ("Priya Sharma", "priya@railopt.in", hash_password("pass123"), "engineer", "S&T"),
            ("Amit Singh", "amit@railopt.in", hash_password("pass123"), "engineer", "Traction"),
            ("Sunita Rao", "sunita@railopt.in", hash_password("pass123"), "manager", "Engineering"),
        ]
        c.executemany(
            "INSERT INTO users (name,email,password,role,department) VALUES (?,?,?,?,?)", users
        )

    # ── Corridors ─────────────────────────────────────────────────────────────
    c.execute("SELECT COUNT(*) FROM corridors")
    if c.fetchone()[0] == 0:
        corridors = [
            ("C1", "Mumbai–Pune Corridor", "CSTM", "PUNE", 192.5, "CR", "Mumbai Division"),
            ("C2", "Delhi–Agra Corridor", "NDLS", "AGC", 200.2, "NCR", "Delhi Division"),
            ("C3", "Chennai–Bangalore Corridor", "MAS", "SBC", 362.0, "SR", "Chennai Division"),
            ("C4", "Howrah–Patna Corridor", "HWH", "PNBE", 531.0, "ER", "Howrah Division"),
            ("C5", "Ahmedabad–Vadodara Corridor", "ADI", "BRC", 98.7, "WR", "Ahmedabad Division"),
        ]
        c.executemany(
            "INSERT INTO corridors (code,name,from_station,to_station,length_km,zone,section) VALUES (?,?,?,?,?,?,?)",
            corridors,
        )

    # ── Assets ────────────────────────────────────────────────────────────────
    c.execute("SELECT COUNT(*) FROM assets")
    if c.fetchone()[0] == 0:
        assets = [
            ("AST001", "Track Section A – KM 120-130", "Track", 1, 125.0, "Good", "2026-07-01", "2026-09-01", 94.5, "High", "Engineering"),
            ("AST002", "OHE Mast KM 125", "OHE", 1, 125.0, "Fair", "2026-06-15", "2026-08-15", 78.2, "Critical", "Traction"),
            ("AST003", "Signal Box SB-12", "Signal", 2, 126.0, "Good", "2026-07-20", "2026-09-20", 98.1, "High", "S&T"),
            ("AST004", "Track Section B – KM 200-210", "Track", 2, 205.0, "Poor", "2026-05-01", "2026-07-01", 62.3, "Critical", "Engineering"),
            ("AST005", "Level Crossing LC-45", "LC", 2, 145.0, "Good", "2026-07-10", "2026-10-10", 99.0, "Medium", "Engineering"),
            ("AST006", "PSI Sub-station SS-07", "PSI", 2, 133.0, "Fair", "2026-06-01", "2026-08-01", 85.0, "High", "Traction"),
            ("AST007", "Track Section C – KM 350-360", "Track", 3, 355.0, "Good", "2026-07-15", "2026-09-15", 91.0, "Medium", "Engineering"),
            ("AST008", "OHE Section KM 200-215", "OHE", 2, 207.0, "Fair", "2026-06-20", "2026-08-20", 80.5, "High", "Traction"),
            ("AST009", "Signal Interlocking SI-22", "Signal", 3, 356.0, "Good", "2026-07-01", "2026-09-01", 97.0, "Medium", "S&T"),
            ("AST010", "Bridge BR-101 KM 410", "Bridge", 4, 410.0, "Fair", "2026-05-10", "2026-08-10", 75.0, "Critical", "Engineering"),
            ("AST011", "Track Section D – KM 80-90", "Track", 5, 85.0, "Good", "2026-07-20", "2026-09-20", 93.0, "Medium", "Engineering"),
            ("AST012", "OHE KM 85", "OHE", 5, 85.0, "Fair", "2026-06-25", "2026-08-25", 82.0, "High", "Traction"),
            ("AST013", "Signal Box SB-33", "Signal", 4, 415.0, "Poor", "2026-04-01", "2026-06-01", 55.0, "Critical", "S&T"),
            ("AST014", "Track Section E – KM 160-170", "Track", 3, 165.0, "Good", "2026-07-05", "2026-09-05", 96.0, "Low", "Engineering"),
            ("AST015", "PSI Sub-station SS-12", "PSI", 4, 420.0, "Good", "2026-07-15", "2026-09-15", 99.0, "Medium", "Traction"),
        ]
        c.executemany(
            "INSERT INTO assets (asset_code,name,type,corridor_id,km_location,condition,last_maintained,next_due,availability,criticality,department) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            assets,
        )

    # ── Trains ────────────────────────────────────────────────────────────────
    c.execute("SELECT COUNT(*) FROM trains")
    if c.fetchone()[0] == 0:
        trains = [
            ("12123", "Deccan Queen", "Superfast", 1, "07:15", "10:25", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", "High", 2.5),
            ("12124", "Deccan Queen Return", "Superfast", 1, "17:10", "20:25", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", "High", 3.0),
            ("12001", "Bhopal Shatabdi", "Shatabdi", 2, "06:00", "10:25", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", "Critical", 5.0),
            ("12002", "Bhopal Shatabdi Return", "Shatabdi", 2, "15:30", "20:00", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", "Critical", 4.5),
            ("12027", "Chennai Shatabdi", "Shatabdi", 3, "06:00", "11:00", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", "Critical", 3.0),
            ("12028", "Chennai Shatabdi Return", "Shatabdi", 3, "15:30", "20:30", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", "Critical", 3.5),
            ("12303", "Poorva Express", "Express", 4, "08:00", "20:45", "Mon,Wed,Fri", "High", 15.0),
            ("12304", "Poorva Express Return", "Express", 4, "09:15", "22:00", "Tue,Thu,Sat", "High", 12.0),
            ("19011", "Gujarat Express", "Express", 5, "07:30", "10:00", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", "Normal", 8.0),
            ("19012", "Gujarat Express Return", "Express", 5, "11:00", "13:30", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", "Normal", 6.0),
            ("12951", "Mumbai Rajdhani", "Rajdhani", 1, "16:35", "08:35", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", "Critical", 5.0),
            ("12952", "Mumbai Rajdhani Return", "Rajdhani", 1, "17:00", "08:45", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", "Critical", 4.0),
            ("22691", "Rajdhani Bangalore", "Rajdhani", 3, "20:00", "06:00", "Tue,Thu,Sun", "Critical", 6.0),
            ("12381", "Poorva Exp (via Gaya)", "Express", 4, "14:00", "04:30", "Mon,Wed,Fri,Sun", "High", 20.0),
            ("12479", "Surya Nagri Express", "Express", 2, "10:15", "16:30", "Mon,Tue,Wed,Thu,Fri,Sat,Sun", "Normal", 10.0),
        ]
        c.executemany(
            "INSERT INTO trains (train_no,name,type,corridor_id,departure_time,arrival_time,days_of_week,priority,avg_delay_min) VALUES (?,?,?,?,?,?,?,?,?)",
            trains,
        )

    # ── Maintenance Tasks ─────────────────────────────────────────────────────
    c.execute("SELECT COUNT(*) FROM maintenance_tasks")
    if c.fetchone()[0] == 0:
        today = date.today()
        tasks = [
            # Engineering tasks
            ("MT001", "Track Geometry Correction", "Rectification of track geometry defects including gauge, cross-level and alignment issues", "Engineering", 1, 1, 122.0, 128.0, 2.0, 8, 9, 9, 5, 7, "Pending", str(today + timedelta(days=1)), "Rajesh Kumar"),
            ("MT002", "Rail Joint Welding", "Thermit welding of rail joints to eliminate fishplate joints for smooth running", "Engineering", 4, 2, 203.0, 208.0, 3.0, 9, 8, 8, 12, 8, "Pending", str(today), "Sunita Rao"),
            ("MT003", "Ballast Tamping – Section C", "Machine tamping of ballast under track for improved alignment and load distribution", "Engineering", 7, 3, 352.0, 358.0, 2.5, 6, 7, 6, 0, 5, "Pending", str(today + timedelta(days=2)), "Rajesh Kumar"),
            ("MT004", "Bridge Inspection – BR-101", "Periodic bridge inspection including measurement of deflections and fatigue checks", "Engineering", 10, 4, 408.0, 412.0, 4.0, 10, 10, 10, 45, 9, "Pending", str(today - timedelta(days=10)), "Sunita Rao"),
            ("MT005", "Level Crossing Gate Repair", "Replacement of gate leaves and repair of gate mechanism at LC-45", "Engineering", 5, 2, 143.0, 147.0, 1.5, 7, 8, 9, 3, 8, "Pending", str(today + timedelta(days=1)), "Rajesh Kumar"),
            ("MT006", "Track Renewal – Section D", "Complete track renewal with new 60 kg/m rails on PSC sleepers", "Engineering", 11, 5, 83.0, 88.0, 3.5, 9, 9, 8, 8, 7, "Pending", str(today), "Sunita Rao"),

            # S&T tasks
            ("MT007", "Signal Lamp Replacement", "Replacement of signal lamps and testing of signal aspects at SB-12", "S&T", 3, 2, 124.0, 127.0, 1.0, 7, 8, 8, 0, 6, "Pending", str(today + timedelta(days=1)), "Priya Sharma"),
            ("MT008", "Interlocking System Check", "Periodic testing and verification of interlocking at SI-22", "S&T", 9, 3, 354.0, 358.0, 1.5, 8, 7, 9, 0, 6, "Pending", str(today + timedelta(days=2)), "Priya Sharma"),
            ("MT009", "Track Circuit Calibration", "Calibration of track circuits for proper train detection at corridor C2", "S&T", 3, 2, 125.0, 132.0, 2.0, 7, 7, 8, 2, 7, "Pending", str(today + timedelta(days=1)), "Priya Sharma"),
            ("MT010", "Signal Box Overhaul – SB-33", "Complete overhaul of relay room and all signals at SB-33", "S&T", 13, 4, 413.0, 417.0, 3.0, 10, 10, 10, 60, 9, "Pending", str(today - timedelta(days=15)), "Priya Sharma"),
            ("MT011", "CBTC System Testing", "Testing and calibration of Communication Based Train Control system", "S&T", 3, 2, 126.0, 130.0, 1.0, 6, 6, 7, 0, 5, "Pending", str(today + timedelta(days=3)), "Priya Sharma"),
            ("MT012", "Level Crossing Warning System", "Testing and repair of automatic warning system at LC-45", "S&T", 5, 2, 143.0, 148.0, 1.0, 8, 9, 10, 4, 9, "Pending", str(today + timedelta(days=1)), "Priya Sharma"),

            # Traction tasks
            ("MT013", "OHE Inspection KM 125", "Inspection and re-tensioning of Overhead Equipment at KM 125", "Traction", 2, 1, 123.0, 127.0, 1.5, 8, 8, 8, 5, 6, "Pending", str(today + timedelta(days=1)), "Amit Singh"),
            ("MT014", "PSI Sub-station Maintenance", "Maintenance of Power Supply Installation including transformer and circuit breakers", "Traction", 6, 2, 130.0, 136.0, 2.5, 9, 8, 9, 10, 7, "Pending", str(today), "Amit Singh"),
            ("MT015", "OHE Stagger Correction", "Correction of OHE stagger deviation beyond permissible limits at KM 205-212", "Traction", 8, 2, 203.0, 212.0, 2.0, 7, 8, 7, 0, 6, "Pending", str(today + timedelta(days=2)), "Amit Singh"),
            ("MT016", "Booster Transformer Replacement", "Replacement of failed booster transformer BT-07 in corridor C2", "Traction", 6, 2, 133.0, 135.0, 3.0, 10, 10, 9, 20, 8, "Pending", str(today - timedelta(days=5)), "Amit Singh"),
            ("MT017", "OHE Section KM 85 Inspection", "Inspection and tension check of OHE section at KM 85, corridor C5", "Traction", 12, 5, 83.0, 87.0, 1.5, 7, 7, 7, 0, 5, "Pending", str(today + timedelta(days=2)), "Amit Singh"),
            ("MT018", "PSI Sub-station 12 Check", "Routine maintenance of SS-12 including oil filtration and relay testing", "Traction", 15, 4, 418.0, 422.0, 2.0, 6, 7, 7, 0, 5, "Pending", str(today + timedelta(days=3)), "Amit Singh"),

            # Cross-department
            ("MT019", "Emergency Track Defect – C4", "Emergency attention to cracked rail web detected at KM 528, corridor C4", "Engineering", 10, 4, 526.0, 530.0, 5.0, 10, 10, 10, 0, 10, "Pending", str(today), "Sunita Rao"),
            ("MT020", "Comprehensive Corridor Survey", "Full corridor safety survey covering track, signal and OHE assets in C2", "Engineering", 4, 2, 200.0, 210.0, 4.0, 7, 6, 7, 0, 5, "Pending", str(today + timedelta(days=5)), "Rajesh Kumar"),
        ]
        c.executemany(
            """INSERT INTO maintenance_tasks
               (task_code,title,description,department,asset_id,corridor_id,km_start,km_end,
                duration_hours,criticality,urgency,safety_risk,overdue_days,train_impact,
                status,scheduled_date,requested_by)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            tasks,
        )
        # compute priority scores
        c.execute("SELECT id, criticality, urgency, safety_risk, overdue_days, train_impact FROM maintenance_tasks")
        rows = c.fetchall()
        for row in rows:
            oid, crit, urg, safe, ov_days, tim = row
            ov_score = min(10, ov_days / 6.0)  # max at 60 days
            score = (0.35 * crit + 0.25 * urg + 0.20 * safe + 0.10 * ov_score + 0.10 * tim)
            c.execute("UPDATE maintenance_tasks SET priority_score=? WHERE id=?", (round(score, 2), oid))

    # ── Blocks (pre-seeded approved blocks) ───────────────────────────────────
    c.execute("SELECT COUNT(*) FROM blocks")
    if c.fetchone()[0] == 0:
        blocks = [
            ("BLK001", 2, "2026-08-20 10:00:00", "2026-08-20 12:00:00", 2.0, "Engineering,S&T,Traction", "1,7,13", 8.6, 1, 8.0, 96.0, "Approved", 1, "AI-optimized multi-department block combining track geometry, signal and OHE maintenance"),
            ("BLK002", 4, "2026-08-21 02:00:00", "2026-08-21 07:00:00", 5.0, "Engineering", "4,19", 9.8, 0, 0.0, 88.0, "Approved", 1, "Night block for bridge inspection and emergency track defect"),
            ("BLK003", 2, "2026-08-22 09:00:00", "2026-08-22 11:30:00", 2.5, "S&T,Traction", "9,14,16", 8.9, 2, 12.0, 94.0, "Approved", 1, "Combined track circuit calibration and PSI maintenance with booster transformer replacement"),
            ("BLK004", 1, "2026-08-23 06:00:00", "2026-08-23 08:00:00", 2.0, "Engineering,Traction", "1,13", 8.1, 1, 5.0, 91.0, "Proposed", 1, "Track geometry and OHE inspection at KM 123-127"),
        ]
        c.executemany(
            """INSERT INTO blocks (block_code,corridor_id,start_time,end_time,duration_hours,
               departments,task_ids,priority_score,train_conflicts,estimated_delay_min,
               block_utilization,status,ai_generated,reason) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            blocks,
        )

    # ── Weekly plans ─────────────────────────────────────────────────────────
    c.execute("SELECT COUNT(*) FROM weekly_plans")
    if c.fetchone()[0] == 0:
        # Current week Monday
        today = date.today()
        monday = today - timedelta(days=today.weekday())
        week_start = str(monday)
        plans = [
            (week_start, 1, 0, "Approved block – multi-dept"),
            (week_start, 2, 1, "Approved block – night bridge"),
            (week_start, 3, 2, "Approved block – S&T+Traction"),
            (week_start, 4, 3, "Proposed block – Engineering+Traction"),
        ]
        c.executemany(
            "INSERT INTO weekly_plans (week_start,block_id,day_of_week,notes) VALUES (?,?,?,?)",
            plans,
        )

    conn.commit()
