# Graph Report - rail-opt  (2026-08-26)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 293 nodes · 566 edges · 13 communities (12 shown, 1 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1780c0aa`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- client.js
- test_upgrade.py
- seed_data.py
- package.json
- optimizer.py
- get_db
- dependencies
- devDependencies
- LoginPage.jsx
- .oxlintrc.json
- Any

## God Nodes (most connected - your core abstractions)
1. `get_db()` - 37 edges
2. `solve_block_schedule()` - 19 edges
3. `calculate_ai_risk_score()` - 16 edges
4. `useTheme()` - 11 edges
5. `init_db()` - 11 edges
6. `react` - 11 edges
7. `scripts` - 11 edges
8. `BlockPlannerPage()` - 10 edges
9. `solve_reschedule()` - 10 edges
10. `calculate_task_duration_adjusted()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `optimize()` --uses--> `OptimizeRequest`  [INFERRED]
  backend/routers/blocks.py → backend/models.py
- `generate_plan()` --uses--> `OptimizerPlanRequest`  [INFERRED]
  backend/routers/blocks.py → backend/models.py
- `reschedule()` --uses--> `RescheduleRequest`  [INFERRED]
  backend/routers/blocks.py → backend/models.py
- `ingest_unified_defect()` --uses--> `UnifiedDefect`  [INFERRED]
  backend/routers/assets.py → backend/models.py
- `login()` --uses--> `AuthResponse`  [INFERRED]
  backend/routers/auth.py → backend/models.py

## Import Cycles
- None detected.

## Communities (13 total, 1 thin omitted)

### Community 0 - "client.js"
Cohesion: 0.06
Nodes (44): plugins, api, createMaintenance(), getAnalytics(), getBlocks(), getCorridors(), getMaintenance(), getWeeklyPlan() (+36 more)

### Community 1 - "test_upgrade.py"
Cohesion: 0.14
Nodes (25): hash_password(), AuthResponse, BlockPlan, BlockRecommendation, DefectLog, LoginRequest, MegaBlocksResponse, OptimizeRequest (+17 more)

### Community 2 - "seed_data.py"
Cohesion: 0.29
Nodes (9): _compute_risk_score(), main(), Compute AI Risk Score using spec formula:…, Insert daily train slots into train_schedules and legacy trains table., Insert multi-department defect logs into unified_defects and maintenance_tasks., Insert pre-computed Mega-Block plans from the seeded defects., seed_block_plans(), seed_defects() (+1 more)

### Community 3 - "package.json"
Cohesion: 0.07
Nodes (29): concurrently, author, bugs, url, description, devDependencies, concurrently, homepage (+21 more)

### Community 4 - "optimizer.py"
Cohesion: 0.11
Nodes (30): Debug: trace exact constraint math for 24h infeasibility, Debug solver feasibility, _build_corridor_lookup(), _build_recommendation_response(), calculate_ai_risk_score(), calculate_task_duration_adjusted(), calculate_task_priority(), calculate_task_risk_score() (+22 more)

### Community 5 - "get_db"
Cohesion: 0.07
Nodes (50): get_db(), init_db(), _seed(), _seed_extended(), health(), lifespan(), get, root() (+42 more)

### Community 6 - "dependencies"
Cohesion: 0.08
Nodes (24): axios, dependencies, axios, lucide-react, react, react-dom, react-router-dom, recharts (+16 more)

### Community 7 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, oxlint, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, vite, @vitejs/plugin-react (+7 more)

### Community 9 - "LoginPage.jsx"
Cohesion: 0.27
Nodes (7): login(), signup(), navItems, Sidebar(), LoginPage(), handleSubmit(), useAuthStore

### Community 10 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): rules, react/only-export-components, react/rules-of-hooks, $schema, warn

## Knowledge Gaps
- **64 isolated node(s):** `oxc`, `ThemeContext`, `DEPT_COLORS`, `PIE_COLORS`, `api` (+59 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_db()` connect `get_db` to `test_upgrade.py`, `seed_data.py`, `optimizer.py`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `react` connect `client.js` to `LoginPage.jsx`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `solve_block_schedule()` connect `optimizer.py` to `test_upgrade.py`, `get_db`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `oxc`, `ThemeContext`, `DEPT_COLORS` to the rest of the system?**
  _64 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `client.js` be split into smaller, more focused modules?**
  _Cohesion score 0.061381074168797956 - nodes in this community are weakly interconnected._
- **Should `test_upgrade.py` be split into smaller, more focused modules?**
  _Cohesion score 0.1350806451612903 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._