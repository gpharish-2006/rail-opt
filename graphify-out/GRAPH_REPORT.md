# Graph Report - rail-opt  (2026-08-26)

## Corpus Check
- 46 files · ~27,974 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 319 nodes · 616 edges · 13 communities
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `325658be`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DashboardPage.jsx
- test_upgrade.py
- RailOpt — Automatic Railway Block Planning System
- package.json
- optimizer.py
- get_db
- dependencies
- devDependencies
- React + Vite
- App.jsx
- .oxlintrc.json

## God Nodes (most connected - your core abstractions)
1. `get_db()` - 38 edges
2. `solve_block_schedule()` - 19 edges
3. `calculate_ai_risk_score()` - 16 edges
4. `init_db()` - 11 edges
5. `react` - 11 edges
6. `useTheme()` - 11 edges
7. `scripts` - 11 edges
8. `calculate_task_duration_adjusted()` - 10 edges
9. `solve_reschedule()` - 10 edges
10. `BlockPlannerPage()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `ingest_unified_defect()` --uses--> `UnifiedDefect`  [INFERRED]
  backend/routers/assets.py → backend/models.py
- `login()` --calls--> `get_db()`  [EXTRACTED]
  backend/routers/auth.py → backend/database.py
- `session()` --calls--> `get_db()`  [EXTRACTED]
  backend/routers/auth.py → backend/database.py
- `signup()` --calls--> `get_db()`  [EXTRACTED]
  backend/routers/auth.py → backend/database.py
- `approve_block()` --calls--> `get_db()`  [EXTRACTED]
  backend/routers/blocks.py → backend/database.py

## Import Cycles
- None detected.

## Communities (13 total, 0 thin omitted)

### Community 0 - "DashboardPage.jsx"
Cohesion: 0.07
Nodes (28): getCorridors(), getBlocks(), optimizeBlock(), saveBlock(), api, getWeeklyPlan(), createMaintenance(), getMaintenance() (+20 more)

### Community 1 - "test_upgrade.py"
Cohesion: 0.09
Nodes (37): hash_password(), AuthResponse, BlockPlan, BlockRecommendation, DefectLog, LoginRequest, MegaBlocksResponse, OptimizeRequest (+29 more)

### Community 2 - "RailOpt — Automatic Railway Block Planning System"
Cohesion: 0.20
Nodes (9): 1. Backend Setup (FastAPI + Google OR-Tools), 2. Frontend Setup (React + Vite + Tailwind CSS), 🚀 Active Server Status, ⚙️ Architecture & Features, 🔐 Demo Officer Login Credentials, 📦 Installation & Setup Instructions, 🛠️ Prerequisites, 📡 Primary API Endpoints (+1 more)

### Community 3 - "package.json"
Cohesion: 0.07
Nodes (29): concurrently, author, bugs, url, description, devDependencies, concurrently, homepage (+21 more)

### Community 4 - "optimizer.py"
Cohesion: 0.08
Nodes (42): init_db(), _seed(), _seed_extended(), Debug: trace exact constraint math for 24h infeasibility, Debug solver feasibility, health(), lifespan(), get (+34 more)

### Community 5 - "get_db"
Cohesion: 0.08
Nodes (38): get_db(), MaintenanceTaskCreate, calculate_task_duration_adjusted(), Adjust maintenance task duration based on operational environment. Per spec:…, get_analytics(), get, get_assets(), get_corridors() (+30 more)

### Community 6 - "dependencies"
Cohesion: 0.08
Nodes (24): axios, dependencies, axios, lucide-react, react, react-dom, react-router-dom, recharts (+16 more)

### Community 7 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, oxlint, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, vite, @vitejs/plugin-react (+7 more)

### Community 8 - "React + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + Vite

### Community 9 - "App.jsx"
Cohesion: 0.13
Nodes (22): plugins, getAnalytics(), login(), signup(), App(), Layout(), navItems, Sidebar() (+14 more)

### Community 10 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): rules, react/only-export-components, react/rules-of-hooks, $schema, warn

## Knowledge Gaps
- **69 isolated node(s):** `$schema`, `oxc`, `react/rules-of-hooks`, `warn`, `name` (+64 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_db()` connect `get_db` to `test_upgrade.py`, `optimizer.py`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `react` connect `App.jsx` to `DashboardPage.jsx`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `solve_block_schedule()` connect `optimizer.py` to `test_upgrade.py`, `get_db`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `$schema`, `oxc`, `react/rules-of-hooks` to the rest of the system?**
  _69 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `DashboardPage.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06753246753246753 - nodes in this community are weakly interconnected._
- **Should `test_upgrade.py` be split into smaller, more focused modules?**
  _Cohesion score 0.0927536231884058 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._