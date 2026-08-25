# RailOpt — Automatic Railway Block Planning System
**Indian Railways / CRIS Operational Block Optimization Engine**

RailOpt is an AI-powered logistics and Constraint Satisfaction Problem (CSP) optimization system designed for Indian Railways operational controllers and officers. It ingests defect logs across **Engineering (TMS)**, **Signalling & Telecom (SMMS)**, and **Traction Distribution (TDMS)**, scoring defect criticality via AI risk models and auto-generating consolidated **Shadow Mega-Blocks** using Google OR-Tools CP-SAT constraint solver.

---

## 🚀 Active Server Status

- **Frontend Application (React + Vite):** [http://localhost:5173/](http://localhost:5173/)
- **Backend API (FastAPI + Uvicorn):** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Interactive API Docs (Swagger UI):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🛠️ Prerequisites

- **Node.js:** v18+ & `npm`
- **Python:** v3.10+ & `pip`

---

## 📦 Installation & Setup Instructions

### 1. Backend Setup (FastAPI + Google OR-Tools)

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the FastAPI backend server with Uvicorn:
   ```bash
   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
   > The database (`railopt.db`) will be automatically initialized and seeded with Indian Railways COA timetables and departmental defects upon startup.

---

### 2. Frontend Setup (React + Vite + Tailwind CSS)

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   > The application will launch on `http://localhost:5173/`.

---

## 🔐 Demo Officer Login Credentials

| Role | Email | Password | Department |
| :--- | :--- | :--- | :--- |
| **Chief Controller** | `admin@railopt.in` | `admin123` | Engineering (TMS) |
| **Signal Engineer** | `priya@railopt.in` | `pass123` | S&T (SMMS) |
| **Traction Officer** | `amit@railopt.in` | `pass123` | Traction (TDMS) |

---

## ⚙️ Architecture & Features

1. **Dual Theme Engine (GIGW / CRIS Compliance):**
   - Light Theme (Government Default: Crisp Warm base `#F4F6F9` with Railway Deep Navy `#0B2545` headers).
   - Dark Theme (Night Shift Operational: Deep Obsidian `#0B0F17`).
2. **Interactive 24-Hour Gantt Timeline:**
   - X-axis 00:00–24:00 time slots, Y-axis kilometer markers.
   - Highlighted Emerald Green Shadow Mega-Blocks merging TMS, SMMS, and TDMS work orders.
   - Controller Override drawer for manual possession slot adjustments.
3. **Google OR-Tools CP-SAT Constraint Solver:**
   - Enforces 15-minute passenger train collision buffer gap.
   - Merges spatial proximity defects ($\le 5\text{ km}$) into single Mega-Blocks, saving cumulative track downtime.

---

## 📡 Primary API Endpoints

- `GET /health` — Backend health status.
- `GET /api/maintenance/unified-defects` — Aggregated TMS, SMMS, TDMS defects with AI risk scores.
- `POST /api/optimizer/generate-plan` — Runs Google OR-Tools CP-SAT solver for 24h / weekly horizon.
- `POST /api/optimizer/reschedule` — Event-driven dynamic rescheduling when a passenger train is delayed.
- `POST /api/block/save` — Approves and saves authorized line blocks.
