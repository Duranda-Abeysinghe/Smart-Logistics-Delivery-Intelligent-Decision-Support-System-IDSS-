# Smart Logistics & Delivery Intelligent Decision Support System (IDSS)

A full-stack, enterprise-grade Intelligent Decision Support System designed to solve five core computational challenges in supply chain, fleet dispatch, network resilience, operational triage, and schedule optimization.

## 🏗️ System Architecture (6 Layers)
1. **Presentation Layer**: React 19, Vite, Tailwind CSS, Lucide Icons, Recharts.
2. **API Controller Layer**: ASP.NET Core Web API (C# .NET 8) with OpenAPI/Swagger.
3. **Algorithm Services Layer**: 5 Modular Computational Engines.
4. **Data Access Layer**: Entity Framework Core (`AppDbContext`, LINQ, Repositories).
5. **Database Layer**: MySQL 8.0 Relational Database (InnoDB, `Locations`, `Routes`, `Vehicles`, `Drivers`, `Orders`, `Inventory`).
6. **Evaluation Layer**: High-precision microsecond telemetry and multi-scale datasets.

## 📁 Repository Structure
```
SMART-LOGISTICS-IDSS-FULL/
├── backend/
│   ├── Controllers/
│   │   ├── BenchmarkController.cs
│   │   ├── DashboardController.cs
│   │   └── TaskControllers.cs
│   ├── Data/
│   │   └── AppDbContext.cs
│   ├── Middleware/
│   │   └── ErrorHandlingMiddleware.cs
│   ├── Models/
│   │   └── Models.cs
│   ├── Services/
│   │   ├── RouteService.cs
│   │   ├── AllocationService.cs
│   │   ├── NetworkService.cs
│   │   ├── DecisionService.cs
│   │   ├── OptimizationService.cs
│   │   └── BenchmarkService.cs
│   ├── appsettings.json
│   ├── Program.cs
│   └── SmartLogistics.csproj
├── datasets/
│   ├── dataset_large.json
│   ├── dataset_medium.json
│   └── dataset_small.json
├── docs/
│   ├── GIT_WORKFLOW.md
│   └── README.md
├── frontend/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── sql/
    └── schema.sql
```

## 🚀 Getting Started

### 1. Database Setup
```bash
mysql -u root -p < sql/schema.sql
```

### 2. Backend Startup (ASP.NET Core Web API)
```bash
cd backend
dotnet restore
dotnet run
```
Swagger UI will be accessible at `http://localhost:5000/swagger`.

### 3. Frontend Startup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to launch the Interactive IDSS Studio.
