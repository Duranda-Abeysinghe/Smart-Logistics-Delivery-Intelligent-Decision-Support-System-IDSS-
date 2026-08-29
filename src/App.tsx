import React, { useState, useMemo } from 'react';
import { ActiveModule, LogisticsNode, LogisticsEdge, Vehicle, Driver, DeliveryOrder } from './types';
import { DEFAULT_NODES, DEFAULT_EDGES, DEFAULT_VEHICLES, DEFAULT_DRIVERS, DEFAULT_ORDERS } from './data/defaultData';
import { Graph } from './dataStructures/Graph';
import { generateSyntheticDataset } from './algorithms/benchmark/datasetGenerator';
import { Navbar } from './components/layout/Navbar';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { RouteOptimizationView } from './components/module1_route/RouteOptimizationView';
import { ResourceAllocationView } from './components/module2_allocation/ResourceAllocationView';
import { NetworkAnalysisView } from './components/module3_network/NetworkAnalysisView';
import { IntelligentDecisionView } from './components/module4_decision/IntelligentDecisionView';
import { OptimizationView } from './components/module5_optimization/OptimizationView';
import { BenchmarkSuiteView } from './components/evaluation/BenchmarkSuiteView';

export default function App() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const [datasetSize, setDatasetSize] = useState<'default' | 'medium' | 'large'>('default');

  // Generate or load dataset based on selection
  const currentData = useMemo(() => {
    if (datasetSize === 'default') {
      const graph = new Graph();
      DEFAULT_NODES.forEach(n => graph.addNode(n));
      DEFAULT_EDGES.forEach(e => graph.addEdge(e, true));

      return {
        graph,
        nodes: DEFAULT_NODES,
        edges: DEFAULT_EDGES,
        vehicles: DEFAULT_VEHICLES,
        drivers: DEFAULT_DRIVERS,
        orders: DEFAULT_ORDERS
      };
    } else if (datasetSize === 'medium') {
      return generateSyntheticDataset(50);
    } else {
      return generateSyntheticDataset(150);
    }
  }, [datasetSize]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        datasetSize={datasetSize}
        onChangeDatasetSize={setDatasetSize}
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
          <BenchmarkSuiteView />
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
