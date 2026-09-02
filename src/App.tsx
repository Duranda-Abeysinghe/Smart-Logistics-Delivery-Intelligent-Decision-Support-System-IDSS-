import React, { useState, useMemo, useEffect } from 'react';
import { ActiveModule, LogisticsNode, LogisticsEdge, Vehicle, Driver, DeliveryOrder } from './types';
import { Graph } from './dataStructures/Graph';
import { fetchNetworkData, NetworkDataResponse } from './services/api';
import { Navbar } from './components/layout/Navbar';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { RouteOptimizationView } from './components/module1_route/RouteOptimizationView';
import { ResourceAllocationView } from './components/module2_allocation/ResourceAllocationView';
import { NetworkAnalysisView } from './components/module3_network/NetworkAnalysisView';
import { IntelligentDecisionView } from './components/module4_decision/IntelligentDecisionView';
import { OptimizationView } from './components/module5_optimization/OptimizationView';
import { BenchmarkSuiteView } from './components/evaluation/BenchmarkSuiteView';

// Root application component. Owns the currently active module/tab and
// orchestrates loading the live dataset from the backend API, then hands
// that data (and a built Graph instance) down to whichever module view
// is currently selected.
export default function App() {
  // Which top-level module/tab is currently visible
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');

  // Live data loaded from the MySQL-backed API (replaces the old hardcoded
  // DEFAULT_NODES / DEFAULT_EDGES / DEFAULT_VEHICLES / DEFAULT_DRIVERS /
  // DEFAULT_ORDERS constants from src/data/defaultData.ts).
  const [dbData, setDbData] = useState<NetworkDataResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the network dataset once on mount. `cancelled` guards against
  // setting state after unmount (e.g. if the component unmounts mid-fetch).
  useEffect(() => {
    let cancelled = false;

    fetchNetworkData()
      .then(data => {
        if (!cancelled) {
          setDbData(data);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load data');
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Build the working graph from the live MySQL-backed dataset only. No
  // synthetic/frontend-generated data is ever used for any feature or graph.
  // Memoized so the Graph is only rebuilt when the underlying data changes,
  // not on every render.
  const currentData = useMemo(() => {
    if (!dbData) return null;

    const graph = new Graph();
    dbData.nodes.forEach(n => graph.addNode(n));
    dbData.edges.forEach(e => graph.addEdge(e, true));

    return {
      graph,
      nodes: dbData.nodes,
      edges: dbData.edges,
      vehicles: dbData.vehicles,
      drivers: dbData.drivers,
      orders: dbData.orders
    };
  }, [dbData]);

  // Show a loading state while the initial fetch is in flight
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center">
        <div className="text-slate-500 text-sm">Loading logistics data from database…</div>
      </div>
    );
  }

  // Show an error state if the fetch failed or produced no usable data,
  // with a hint pointing developers at the likely cause (backend/API misconfig)
  if (loadError || !currentData) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="text-red-600 font-semibold mb-2">Could not load data from the API</div>
          <div className="text-slate-500 text-sm mb-2">{loadError}</div>
          <div className="text-slate-400 text-xs">
            Make sure the ASP.NET Core backend is running and connected to the MySQL
            database (see sql/schema.sql), and that VITE_API_BASE_URL points at it.
          </div>
        </div>
      </div>
    );
  }

  // Main app shell: navbar, active module's view, and footer.
  // Only one module view renders at a time based on `activeModule`.
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeModule === 'dashboard' && (
          <DashboardOverview
            onSelectModule={setActiveModule}
            nodes={currentData.nodes}
            vehicles={currentData.vehicles}
            drivers={currentData.drivers}
            orders={currentData.orders}
          />
        )}

        {activeModule === 'route' && (
          <RouteOptimizationView
            graph={currentData.graph}
            nodes={currentData.nodes}
            edges={currentData.edges}
          />
        )}

        {activeModule === 'allocation' && (
          <ResourceAllocationView
            orders={currentData.orders}
            vehicles={currentData.vehicles}
            drivers={currentData.drivers}
          />
        )}

        {activeModule === 'network' && (
          <NetworkAnalysisView
            graph={currentData.graph}
            nodes={currentData.nodes}
            edges={currentData.edges}
          />
        )}

        {activeModule === 'decision' && (
          <IntelligentDecisionView
            orders={currentData.orders}
          />
        )}

        {activeModule === 'optimization' && (
          <OptimizationView
            nodes={currentData.nodes}
          />
        )}

        {activeModule === 'evaluation' && (
          <BenchmarkSuiteView
            graph={currentData.graph}
            nodes={currentData.nodes}
            edges={currentData.edges}
            orders={currentData.orders}
            vehicles={currentData.vehicles}
            drivers={currentData.drivers}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-slate-400 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-bold text-slate-200">Smart Logistics & Delivery IDSS</span> • Multi-Algorithm Decision Support System
          </div>
          <div className="text-slate-500 text-[11px]">
            React + Vite Frontend • ASP.NET Core API Services • Entity Framework Core • MySQL 8.0
          </div>
        </div>
      </footer>
    </div>
  );
}
