# Smart Logistics & Delivery IDSS — System Summary & Issue Comparison

## 1. What the system is

SmartLogistics IDSS is a full-stack decision-support system for a delivery/logistics
operation, built as:

- **Frontend:** React 19 + Vite + TypeScript, Tailwind CSS, Recharts for charts,
  lucide-react for icons.
- **Backend:** ASP.NET Core 8 Web API, Entity Framework Core, MySQL 8.0 (via Pomelo
  connector).
- **Six UI modules:** Dashboard, Route Optimizer, Fleet Allocation, Network Analytics,
  Decision & Priority, Schedule Planner (TSP), plus a Performance Analytics
  (benchmark) module.

The domain model (Locations/Hubs, Routes, Vehicles, Drivers, Orders, Inventory) is
stored in MySQL (`sql/schema.sql`) and exposed through `AppDbContext` (EF Core). A
single endpoint, `GET /api/dashboard/network-data`, returns the full dataset shaped to
match the frontend's TypeScript types.

## 2. Architecture as found (before this pass)

The backend is fully built out and, on paper, matches your 5 issues almost exactly:

| Backend piece | Implements |
|---|---|
| `RouteController` / `RouteService` | Issue 1 — Dijkstra, A* over a graph built from `Locations`+`Routes` |
| `AllocationController` / `AllocationService` | Issue 2 — Greedy priority dispatch, 0/1 Knapsack DP |
| `NetworkController` / `NetworkService` | Issue 3 — Degree/Closeness/Betweenness centrality, bridge-finding DFS |
| `DecisionController` / `DecisionService` | Issue 4 — Weighted scoring, k‑NN, rule-based directives |
| `OptimizationController` / `OptimizationService` | Issue 5 — Held‑Karp DP, Greedy Nearest-Neighbor, Genetic Algorithm |
| `BenchmarkController` / `BenchmarkService` | A scale-parameterized benchmark endpoint |

**However, the frontend never calls any of these endpoints.** The only network call
the whole app makes is `fetchNetworkData()` → `GET /api/dashboard/network-data`, which
returns raw rows only (locations, routes, vehicles, drivers, orders). Every module
(`RouteOptimizationView`, `ResourceAllocationView`, `NetworkAnalysisView`,
`IntelligentDecisionView`, `OptimizationView`, `BenchmarkSuiteView`) imports and runs
its **own duplicate implementation** of the algorithms client-side, in
`src/algorithms/**/*.ts`, using the raw rows fetched from the API. The six backend
controllers built for Issues 1–5 are effectively dead code from the UI's point of
view.

## 3. What was wrong with the data ("Logistic Network" / UI data)

Two concrete problems were found and fixed in this pass:

### a) The "Logistics Network" dataset switcher (Navbar)
The navbar had a **Small / Medium / Large** hub-count switcher labeled "Logistics
Network:". "Small (12 Hubs)" used the real MySQL data. **"Medium (50 Hubs)" and
"Large (150 Hubs)" called `generateSyntheticDataset()`** — a frontend function that
fabricated random hub coordinates, routes, orders, vehicles and drivers using
`Math.random()`, with zero connection to the database. Every module (Route,
Allocation, Network, Decision, Optimization) would silently switch to this fake data
whenever a user picked Medium/Large.

**Fix:** the switcher and `generateSyntheticDataset()` have been removed entirely.
The app now always builds its working graph from the live `network-data` API
response — there is no code path left that can substitute synthetic data for any
module.

### b) The Performance Analytics (Benchmark) module
This module was **always** running on fake data, regardless of the navbar switcher —
and part of its output wasn't even computed, just hardcoded:
- `runFullBenchmarkSuite()` called `generateSyntheticDataset(10/50/150)` unconditionally.
- The "Engine Performance & Latency Matrix" table's `n10TimeMs` / `n50TimeMs` /
  `n150TimeMs` columns were **literal hardcoded constants** in the source code (e.g.
  `n10TimeMs: 0.08, n50TimeMs: 0.35, n150TimeMs: 1.25`), not the result of any
  algorithm run at all.

**Fix:** `benchmarkRunner.ts` was rewritten to accept the real dataset (graph, nodes,
edges, orders, vehicles, drivers) as input and run each algorithm **once, live,
against whatever is actually in the database**, using `performance.now()`-based
timing already present in each algorithm. The summary table is now built directly
from those measured results — no hardcoded numbers remain. Because the real seed
data only has ~12 locations, the old "N=10 vs N=50 vs N=150" scaling comparison
(which needed fake data to populate the larger sizes) was replaced with a live
single-point measurement against the actual current database size, clearly labeled
as such in the UI (e.g. "N=12 Hubs (actual DB)").

*(Note: `Math.random()` calls inside the Genetic Algorithm and Simulated Annealing
implementations were left untouched — that's the algorithms' own internal randomness,
e.g. mutation/perturbation, not synthetic input data, and removing it would break the
algorithms themselves.)*

*(Also worth flagging: the backend's own `BenchmarkController` computes its timings
from a closed-form formula, e.g. `0.45 * (scale/12.0) * log2(scale+1)`, rather than
measuring anything — but since the frontend never calls it, it has no effect on what
users see and was left as-is.)*

### Verification
- `npx tsc --noEmit` — passes with no errors (strict `noUnusedLocals`/`noUnusedParameters` included).
- `npx vitest run` — all 5 existing tests pass.
- `npm run build` — production build succeeds.

## 4. Files changed in this pass

| File | Change |
|---|---|
| `src/components/layout/Navbar.tsx` | Removed the "Logistics Network" dataset-size switcher UI and its props |
| `src/App.tsx` | Removed `datasetSize` state and synthetic-dataset branch; always builds the graph from the real API response; wired real data into `BenchmarkSuiteView` |
| `src/algorithms/benchmark/datasetGenerator.ts` | **Deleted** — no longer used anywhere |
| `src/algorithms/benchmark/benchmarkRunner.ts` | Rewritten to take the real dataset as a parameter and measure algorithms live instead of generating fake data / hardcoding results |
| `src/components/evaluation/BenchmarkSuiteView.tsx` | Now receives the real dataset as props; charts/table show live-measured values labeled by actual DB size; removed unused imports |

## 5. Comparison against your 5 issue specs

| | Your spec | What exists in the codebase | Gap |
|---|---|---|---|
| **Issue 1 — Route Optimization** | Dijkstra, A*, Bellman-Ford on a graph (adjacency list) built from Locations+Routes; priority queue; Member A = algorithms, Member B = API + UI | **Duplicated.** Backend: `RouteService` implements Dijkstra + A* over EF-Core-loaded data, exposed at `POST /api/route/optimize`. Frontend: separate TS implementations of Dijkstra, A*, **and also Bellman-Ford + Floyd-Warshall** (two extra algorithms beyond the spec) in `src/algorithms/route/*.ts`, run in-browser on data pulled from `/dashboard/network-data`. | UI never calls `/api/route/optimize` — the backend algorithm work is unused. Bellman-Ford/Floyd-Warshall exist only on the frontend, not in the backend service. |
| **Issue 2 — Resource Allocation** | Greedy, DP (knapsack), Genetic Algorithm; drivers/vehicles/orders loaded from DB | **Duplicated.** Backend: `AllocationService` implements Greedy + 0/1 Knapsack DP (no GA), exposed at `POST /api/allocation/allocate`. Frontend: separate TS implementations of Greedy, Knapsack DP, **and Genetic Algorithm** in `src/algorithms/allocation/*.ts`, run in-browser. | Same dead-endpoint issue. Also the backend is missing the GA variant your spec calls for — only the frontend has all three. |
| **Issue 3 — Network Analysis** | BFS/DFS, Degree/Closeness/Betweenness centrality; graph + metrics sent to frontend | **Duplicated.** Backend: `NetworkService` computes Degree/Closeness/Betweenness (Brandes' algorithm) + bridge-finding DFS, exposed at `GET /api/network/analyze`. Frontend: separate TS implementations of BFS/DFS traversal + all three centrality measures in `src/algorithms/network/*.ts`, run in-browser. | Same dead-endpoint issue — the backend never actually "sends metrics to the frontend" in practice, because nothing calls it. |
| **Issue 4 — Intelligent Decision Module** | Weighted scoring, k-NN, rule-based ranking; feature vectors; ranked list + explanation | **Duplicated.** Backend: `DecisionService` implements weighted scoring + k-NN + rule directives, exposed at `POST /api/decision/prioritize`. Frontend: separate TS implementations of weighted scoring, k-NN, and rule engine in `src/algorithms/decision/*.ts`, run in-browser, including the explanation objects your spec asks for. | Same dead-endpoint issue. |
| **Issue 5 — Optimization Module** | DP, Greedy, GA, Simulated Annealing; compare results | **Duplicated.** Backend: `OptimizationService` implements Held-Karp exact DP, Greedy Nearest-Neighbor, and GA (no SA), exposed at `POST /api/optimization/tsp`. Frontend: separate TS implementations of DP, Greedy, GA, **and Simulated Annealing** in `src/algorithms/optimization/*.ts`, run in-browser. | Same dead-endpoint issue, and the backend is missing Simulated Annealing (only the frontend has it). |

### Headline gap across all 5 issues
Every issue's "Member A: implement algorithms" + "Member B: API endpoints + UI" split
**exists twice** — once correctly as an ASP.NET Core service behind a REST endpoint
(matching the spec's architecture), and once as an independent client-side
reimplementation in TypeScript that the UI actually uses. The database is the source
of truth for raw entities (locations, routes, vehicles, drivers, orders) via
`/api/dashboard/network-data`, but **algorithm execution itself happens entirely in
the browser**, not through the five dedicated API endpoints your issues describe.
This is separate from — and in addition to — the synthetic-data problem (Section 3),
which has been fixed in this pass.

If you want the frontend rewired to actually call `/api/route/optimize`,
`/api/allocation/allocate`, `/api/network/analyze`, `/api/decision/prioritize`, and
`/api/optimization/tsp` instead of computing locally (so the architecture matches
your issue specs exactly, and the backend stops being dead code), that's a further,
separate piece of work — each view's response-handling would need to be adapted to
each endpoint's JSON shape, and the missing algorithm variants (Bellman-Ford/
Floyd-Warshall on the backend, GA in `AllocationService`, Simulated Annealing in
`OptimizationService`) would need to be added so the backend matches full parity with
the frontend. Happy to do that next if that's what you're after.
