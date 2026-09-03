# Git Workflow & Branching Strategy

## Repository Branching Model
- `main`: Production-ready release branch.
- `develop`: Integration branch for all 5 algorithmic modules.
- `feature/module-1-route`: Route optimization algorithms (Dijkstra, A*, Bellman-Ford).
- `feature/module-2-allocation`: Resource allocation (0/1 Knapsack DP, Genetic Algorithm).
- `feature/module-3-network`: Network analysis (BFS/DFS, Brandes Centrality, Tarjan Bridges).
- `feature/module-4-decision`: Decision support (AHP Weighted Scoring, k-NN, Rule Engine).
- `feature/module-5-optimization`: Multi-stop TSP tour optimization (Held-Karp, SA).
- `feature/backend-api`: ASP.NET Core Web API controllers & EF Core data models.
- `feature/frontend-ui`: React + Vite presentation dashboard & analytics studios.

## Commit Message Convention
- `feat: [Module] Add new algorithm or endpoint`
- `fix: [Module] Resolve computational or boundary edge case`
- `perf: [Module] Optimize execution time or memory complexity`
- `test: [Module] Add unit and multi-scale benchmark tests`
- `docs: [Module] Update architecture and API documentation`
