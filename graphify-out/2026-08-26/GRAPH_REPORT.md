# Graph Report - rail-opt  (2026-08-25)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 206 nodes · 409 edges · 10 communities
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `552a7963`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- client.js
- get_db
- App.jsx
- blocks.py
- dependencies
- solve_block_schedule
- devDependencies
- .oxlintrc.json

## God Nodes (most connected - your core abstractions)
1. `get_db()` - 26 edges
2. `solve_block_schedule()` - 13 edges
3. `react` - 12 edges
4. `useTheme()` - 11 edges
5. `BlockPlannerPage()` - 10 edges
6. `calculate_ai_risk_score()` - 9 edges
7. `solve_reschedule()` - 9 edges
8. `MaintenancePage()` - 8 edges
9. `getMaintenance()` - 7 edges
10. `init_db()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `create_maintenance()` --uses--> `MaintenanceTaskCreate`  [INFERRED]
  backend/routers/maintenance.py → backend/models.py
- `login()` --uses--> `AuthResponse`  [INFERRED]
  backend/routers/auth.py → backend/models.py
- `signup()` --uses--> `AuthResponse`  [INFERRED]
  backend/routers/auth.py → backend/models.py
- `login()` --uses--> `LoginRequest`  [INFERRED]
  backend/routers/auth.py → backend/models.py
- `optimize()` --uses--> `OptimizeRequest`  [INFERRED]
  backend/routers/blocks.py → backend/models.py

## Import Cycles
- None detected.

## Communities (10 total, 0 thin omitted)

### Community 0 - "client.js"
Cohesion: 0.07
Nodes (29): api, createMaintenance(), getBlocks(), getCorridors(), getMaintenance(), getWeeklyPlan(), optimizeBlock(), saveBlock() (+21 more)

### Community 1 - "get_db"
Cohesion: 0.12
Nodes (26): get_db(), init_db(), _seed(), health(), lifespan(), get, root(), MaintenanceTaskCreate (+18 more)

### Community 2 - "App.jsx"
Cohesion: 0.14
Nodes (20): getAnalytics(), login(), signup(), App(), Layout(), navItems, Sidebar(), pageTitles (+12 more)

### Community 3 - "blocks.py"
Cohesion: 0.16
Nodes (25): hash_password(), AuthResponse, BlockRecommendation, LoginRequest, OptimizeRequest, OptimizerPlanRequest, OptimizerPlanResponse, RescheduleRequest (+17 more)

### Community 4 - "dependencies"
Cohesion: 0.08
Nodes (24): axios, dependencies, axios, lucide-react, react, react-dom, react-router-dom, recharts (+16 more)

### Community 5 - "solve_block_schedule"
Cohesion: 0.24
Nodes (15): Any, build_recommendation_response(), calculate_ai_risk_score(), optimize_blocks(), RailOpt AI Engine — Hybrid AI Prioritization & Google OR-Tools CP-SAT Solver…, Event-driven dynamic rescheduling when a passenger train is delayed. Adjusts…, Priority Score = w1 * Criticality + w2 * OverdueDays + w3 * SafetyRisk - w4 *…, Builds frontend-compatible recommendation object. (+7 more)

### Community 6 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, oxlint, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, vite, @vitejs/plugin-react (+7 more)

### Community 7 - ".oxlintrc.json"
Cohesion: 0.25
Nodes (7): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, warn

## Knowledge Gaps
- **40 isolated node(s):** `api`, `configs`, `dots`, `DEPT_BADGE_STYLE`, `DEPT_BAR_COLOR` (+35 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_db()` connect `get_db` to `blocks.py`, `solve_block_schedule`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `react` connect `App.jsx` to `client.js`, `.oxlintrc.json`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `plugins` connect `.oxlintrc.json` to `App.jsx`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `api`, `configs`, `dots` to the rest of the system?**
  _40 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `client.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07215541165587419 - nodes in this community are weakly interconnected._
- **Should `get_db` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14193548387096774 - nodes in this community are weakly interconnected._