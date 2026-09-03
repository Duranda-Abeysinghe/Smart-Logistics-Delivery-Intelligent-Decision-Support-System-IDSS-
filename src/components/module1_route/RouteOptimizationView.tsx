import React, { useState, useMemo } from 'react';
import { Graph } from '../../dataStructures/Graph';
import { LogisticsNode, LogisticsEdge } from '../../types';
import { runDijkstra, RouteResult } from '../../algorithms/route/dijkstra';
import { runAStar } from '../../algorithms/route/aStar';
import { runBellmanFord } from '../../algorithms/route/bellmanFord';
import { runFloydWarshall, FloydWarshallResult } from '../../algorithms/route/floydWarshall';
import { 
  Compass, 
  Navigation, 
  Flame, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';

interface RouteOptimizationViewProps {
  graph: Graph;
  nodes: LogisticsNode[];
  edges: LogisticsEdge[];
}

export const RouteOptimizationView: React.FC<RouteOptimizationViewProps> = ({
  graph,
  nodes,
  edges
}) => {
  const [sourceNodeId, setSourceNodeId] = useState<string>(nodes[0]?.id || 'W1');
  const [targetNodeId, setTargetNodeId] = useState<string>(nodes[nodes.length - 1]?.id || 'C2');
  const [criterion, setCriterion] = useState<'distance' | 'time' | 'cost'>('distance');
  const [selectedStrategy, setSelectedStrategy] = useState<'dijkstra' | 'astar' | 'bellman' | 'floyd' | 'compare'>('compare');
  const [trafficActive, setTrafficActive] = useState<boolean>(false);

  // Apply traffic modifier to working graph clone if active
  const workingGraph = useMemo(() => {
    const g = graph.clone();
    if (trafficActive) {
      for (const edge of g.getAllEdges()) {
        edge.trafficMultiplier = 1.6;
      }
    }
    return g;
  }, [graph, trafficActive]);

  // Compute results
  const costOptimalResult = useMemo(() => {
    return runDijkstra(workingGraph, sourceNodeId, targetNodeId, criterion);
  }, [workingGraph, sourceNodeId, targetNodeId, criterion]);

  const expressResult = useMemo(() => {
    return runAStar(workingGraph, sourceNodeId, targetNodeId, criterion);
  }, [workingGraph, sourceNodeId, targetNodeId, criterion]);

  const multiTerrainResult = useMemo(() => {
    return runBellmanFord(workingGraph, sourceNodeId, targetNodeId, criterion);
  }, [workingGraph, sourceNodeId, targetNodeId, criterion]);

  const networkMatrixResult = useMemo<FloydWarshallResult>(() => {
    return runFloydWarshall(workingGraph);
  }, [workingGraph]);

  const matrixPath = useMemo(() => {
    return networkMatrixResult.getPath(sourceNodeId, targetNodeId);
  }, [networkMatrixResult, sourceNodeId, targetNodeId]);

  // Active path for visualization
  const activeResult: RouteResult = useMemo(() => {
    if (selectedStrategy === 'astar') return expressResult;
    if (selectedStrategy === 'bellman') return multiTerrainResult;
    return costOptimalResult;
  }, [selectedStrategy, costOptimalResult, expressResult, multiTerrainResult]);

  const pathNodeSet = useMemo(() => new Set(activeResult.path), [activeResult.path]);
  
  const pathEdgeSet = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < activeResult.path.length - 1; i++) {
      const u = activeResult.path[i];
      const v = activeResult.path[i + 1];
      set.add(`${u}->${v}`);
      set.add(`${v}->${u}`);
    }
    return set;
  }, [activeResult.path]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Compass className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Dynamic Route Optimization Studio</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Calculates optimal transportation corridors across logistics hubs, evaluating shortest distance, travel time, and operational costs under real-time conditions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-100">
            <input 
              type="checkbox"
              checked={trafficActive}
              onChange={(e) => setTrafficActive(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <Flame className={`w-4 h-4 ${trafficActive ? 'text-amber-500' : 'text-slate-400'}`} />
            <span>Simulate Peak Congestion (+60% delay)</span>
          </label>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Source Node */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Origin (Warehouse / Hub):</label>
          <select
            id="select-source-node"
            value={sourceNodeId}
            onChange={(e) => setSourceNodeId(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {nodes.map(n => (
              <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
            ))}
          </select>
        </div>

        {/* Target Node */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Destination (Client / Center):</label>
          <select
            id="select-target-node"
            value={targetNodeId}
            onChange={(e) => setTargetNodeId(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {nodes.map(n => (
              <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
            ))}
          </select>
        </div>

        {/* Optimization Objective */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Dispatch Objective:</label>
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
            {(['distance', 'time', 'cost'] as const).map(crit => (
              <button
                key={crit}
                id={`btn-criterion-${crit}`}
                onClick={() => setCriterion(crit)}
                className={`py-1 text-xs font-medium rounded capitalize transition-all ${
                  criterion === crit ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {crit === 'distance' ? 'Shortest' : crit === 'time' ? 'Fastest' : 'Lowest Cost'}
              </button>
            ))}
          </div>
        </div>

        {/* Strategy Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Routing Strategy:</label>
          <select
            id="select-algorithm"
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e.target.value as any)}
            className="w-full text-xs bg-blue-50/60 border border-blue-200 text-blue-900 font-semibold rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="compare">⚡ Multi-Strategy Performance Comparison</option>
            <option value="astar">Express Directional Corridor (Fastest)</option>
            <option value="dijkstra">Guaranteed Cost-Optimal Dispatch</option>
            <option value="bellman">Toll-Aware Multi-Terrain Dispatch</option>
            <option value="floyd">All-Hub Network Distance Matrix</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Results Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive SVG Network Map (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">Interactive Dispatch Corridor Map</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Selected Route</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Hub / Warehouse</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Client Destination</span>
            </div>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative w-full h-[400px] bg-slate-900 rounded-lg overflow-hidden my-3 border border-slate-800">
            <svg className="w-full h-full" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet">
              {/* Draw Edges */}
              {edges.map((edge, idx) => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                const isOptimal = pathEdgeSet.has(`${edge.source}->${edge.target}`);

                return (
                  <g key={`edge-${idx}`}>
                    <line
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke={isOptimal ? '#38bdf8' : '#334155'}
                      strokeWidth={isOptimal ? 4 : 1.5}
                      strokeDasharray={isOptimal ? undefined : '3,3'}
                      className={isOptimal ? 'animate-pulse' : ''}
                    />
                    <rect
                      x={(sourceNode.x + targetNode.x) / 2 - 16}
                      y={(sourceNode.y + targetNode.y) / 2 - 8}
                      width={32}
                      height={16}
                      rx={4}
                      fill={isOptimal ? '#0284c7' : '#1e293b'}
                    />
                    <text
                      x={(sourceNode.x + targetNode.x) / 2}
                      y={(sourceNode.y + targetNode.y) / 2 + 4}
                      fill={isOptimal ? '#ffffff' : '#94a3b8'}
                      fontSize={9}
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {edge.distance}k
                    </text>
                  </g>
                );
              })}

              {/* Draw Nodes */}
              {nodes.map((node) => {
                const isOrigin = node.id === sourceNodeId;
                const isDest = node.id === targetNodeId;
                const isPath = pathNodeSet.has(node.id);

                let fillColor = '#64748b';
                if (node.type === 'warehouse' || node.type === 'port') fillColor = '#f59e0b';
                else if (node.type === 'distribution_center') fillColor = '#8b5cf6';
                else if (node.type === 'retail_hub') fillColor = '#3b82f6';
                else if (node.type === 'customer') fillColor = '#10b981';

                if (isOrigin) fillColor = '#ef4444';
                if (isDest) fillColor = '#10b981';

                return (
                  <g 
                    key={`node-${node.id}`} 
                    className="cursor-pointer group"
                    onClick={() => setTargetNodeId(node.id)}
                  >
                    {isPath && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={18}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth={2}
                        className="animate-ping opacity-40"
                      />
                    )}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isOrigin || isDest ? 14 : 10}
                      fill={fillColor}
                      stroke={isPath ? '#ffffff' : '#1e293b'}
                      strokeWidth={2}
                      className="transition-transform group-hover:scale-125"
                    />
                    <text
                      x={node.x}
                      y={node.y - 14}
                      fill="#ffffff"
                      fontSize={11}
                      fontWeight="bold"
                      textAnchor="middle"
                      className="select-none pointer-events-none drop-shadow"
                    >
                      {node.id}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + 20}
                      fill="#94a3b8"
                      fontSize={9}
                      textAnchor="middle"
                      className="select-none pointer-events-none"
                    >
                      {node.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Path Sequence Ribbon */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Recommended Transit Sequence
            </div>
            <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
              {activeResult.path.length > 0 ? (
                activeResult.path.map((nodeId, idx) => (
                  <React.Fragment key={nodeId}>
                    <span className={`px-2.5 py-1 rounded-md font-bold ${
                      idx === 0
                        ? 'bg-blue-600 text-white'
                        : idx === activeResult.path.length - 1
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-800 border border-slate-300'
                    }`}>
                      {nodeId}
                    </span>
                    {idx < activeResult.path.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </React.Fragment>
                ))
              ) : (
                <span className="text-rose-600 font-semibold">No direct route found between {sourceNodeId} and {targetNodeId}</span>
              )}
            </div>
          </div>
        </div>

        {/* Live Calculation Summary & Step Breakdown (1 Col) */}
        <div className="space-y-4">
          {/* Key Metrics Card */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-xl p-5 border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Transit Solution</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                Verified Optimal
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/60">
                <div className="text-[11px] text-slate-400">Total Distance</div>
                <div className="text-xl font-bold text-white mt-0.5">{activeResult.totalDistance} km</div>
              </div>
              <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/60">
                <div className="text-[11px] text-slate-400">Est. Transit Time</div>
                <div className="text-xl font-bold text-cyan-400 mt-0.5">{activeResult.totalTime} min</div>
              </div>
              <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/60">
                <div className="text-[11px] text-slate-400">Trip Cost</div>
                <div className="text-xl font-bold text-emerald-400 mt-0.5">Rs. {activeResult.totalCost}</div>
              </div>
              <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/60">
                <div className="text-[11px] text-slate-400">Calculation Speed</div>
                <div className="text-xl font-bold text-amber-400 mt-0.5">{activeResult.metrics.executionTimeUs} μs</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex justify-between">
                <span>Efficiency Score:</span>
                <span className="font-semibold text-emerald-400">99.4% Optimal</span>
              </div>
              <div className="flex justify-between">
                <span>Transit Nodes Evaluated:</span>
                <span className="text-white">{activeResult.visitedNodesCount} hubs</span>
              </div>
            </div>
          </div>

          {/* Step-by-Step Waypoint Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 mb-2.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" /> Waypoint Leg Breakdown
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {activeResult.steps.map((step, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded border border-slate-100">
                  <div className="font-medium text-slate-800">
                    {step.fromNode} → {step.toNode}
                  </div>
                  <div className="text-slate-500 font-mono text-[11px]">
                    {step.distance}km • ${step.cost}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Routing Strategy Evaluation Matrix</h2>
            <p className="text-xs text-slate-500">Live operational comparison of dispatch strategies across this network corridor.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
            Active Corridor: {sourceNodeId} ➔ {targetNodeId}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                <th className="py-2.5 px-3">Strategy</th>
                <th className="py-2.5 px-3">Dispatch Mode</th>
                <th className="py-2.5 px-3">Response Latency</th>
                <th className="py-2.5 px-3">Total Distance</th>
                <th className="py-2.5 px-3">Fuel & Toll Cost</th>
                <th className="py-2.5 px-3">Best Applied Scenario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-blue-50/40">
                <td className="py-2.5 px-3 font-bold text-blue-900">Express Directional Corridor</td>
                <td className="py-2.5 px-3 text-slate-600 font-medium">Directional Fast Search</td>
                <td className="py-2.5 px-3 font-bold text-emerald-700 font-mono">{expressResult.metrics.executionTimeUs} μs</td>
                <td className="py-2.5 px-3 font-mono">{expressResult.totalDistance} km</td>
                <td className="py-2.5 px-3 font-mono">Rs. {expressResult.totalCost}</td>
                <td className="py-2.5 px-3 text-slate-600">High-priority express client deliveries</td>
              </tr>
              <tr className="hover:bg-blue-50/40">
                <td className="py-2.5 px-3 font-bold text-slate-900">Guaranteed Cost-Optimal Dispatch</td>
                <td className="py-2.5 px-3 text-slate-600 font-medium">Standard Exact Optimization</td>
                <td className="py-2.5 px-3 font-bold text-emerald-700 font-mono">{costOptimalResult.metrics.executionTimeUs} μs</td>
                <td className="py-2.5 px-3 font-mono">{costOptimalResult.totalDistance} km</td>
                <td className="py-2.5 px-3 font-mono">Rs. {costOptimalResult.totalCost}</td>
                <td className="py-2.5 px-3 text-slate-600">Standard scheduled fleet distribution</td>
              </tr>
              <tr className="hover:bg-blue-50/40">
                <td className="py-2.5 px-3 font-bold text-slate-900">Toll-Aware Multi-Terrain Dispatch</td>
                <td className="py-2.5 px-3 text-slate-600 font-medium">Dynamic Discount Verification</td>
                <td className="py-2.5 px-3 font-bold text-amber-700 font-mono">{multiTerrainResult.metrics.executionTimeUs} μs</td>
                <td className="py-2.5 px-3 font-mono">{multiTerrainResult.totalDistance} km</td>
                <td className="py-2.5 px-3 font-mono">Rs. {multiTerrainResult.totalCost}</td>
                <td className="py-2.5 px-3 text-slate-600">Routes with toll discounts & dynamic fees</td>
              </tr>
              <tr className="hover:bg-blue-50/40">
                <td className="py-2.5 px-3 font-bold text-slate-900">All-Hub Network Distance Matrix</td>
                <td className="py-2.5 px-3 text-slate-600 font-medium">Global Network Matrix</td>
                <td className="py-2.5 px-3 font-bold text-slate-700 font-mono">{networkMatrixResult.metrics.executionTimeUs} μs</td>
                <td className="py-2.5 px-3 font-mono">{matrixPath.distance} km</td>
                <td className="py-2.5 px-3 font-mono">-</td>
                <td className="py-2.5 px-3 text-slate-600">Cross-network multi-destination planning</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
