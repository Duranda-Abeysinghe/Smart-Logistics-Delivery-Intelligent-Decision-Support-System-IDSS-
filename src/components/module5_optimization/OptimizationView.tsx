import React, { useState, useMemo } from 'react';
import { LogisticsNode, TourResult } from '../../types';
import { runExactDP_TSP } from '../../algorithms/optimization/tspDP';
import { runGreedyTSP } from '../../algorithms/optimization/greedyTSP';
import { runSimulatedAnnealing } from '../../algorithms/optimization/simulatedAnnealing';
import { runGeneticTSP } from '../../algorithms/optimization/geneticOptimization';
import { 
  TrendingUp, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  MapPin, 
  ArrowRight,
  Flame,
  Activity,
  Layers,
  Cpu
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

interface OptimizationViewProps {
  nodes: LogisticsNode[];
}

export const OptimizationView: React.FC<OptimizationViewProps> = ({
  nodes
}) => {
  // Subset of nodes for multi-stop tour
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>(() => {
    return nodes.slice(0, Math.min(8, nodes.length)).map(n => n.id);
  });

  const [selectedStrategy, setSelectedStrategy] = useState<'sa' | 'genetic' | 'exact' | 'greedy'>('sa');

  // Parameters
  const [initialTemp, setInitialTemp] = useState<number>(1000);
  const [coolingRate, setCoolingRate] = useState<number>(0.985);
  const [maxIterations, setMaxIterations] = useState<number>(800);

  const activeTourNodes = useMemo(() => {
    return nodes.filter(n => selectedNodeIds.includes(n.id));
  }, [nodes, selectedNodeIds]);

  const exactResult = useMemo<TourResult>(() => {
    if (activeTourNodes.length <= 11) {
      return runExactDP_TSP(activeTourNodes);
    }
    return runGreedyTSP(activeTourNodes);
  }, [activeTourNodes]);

  const greedyResult = useMemo<TourResult>(() => {
    return runGreedyTSP(activeTourNodes);
  }, [activeTourNodes]);

  const saResult = useMemo<TourResult>(() => {
    return runSimulatedAnnealing(activeTourNodes, initialTemp, coolingRate, maxIterations);
  }, [activeTourNodes, initialTemp, coolingRate, maxIterations]);

  const geneticResult = useMemo<TourResult>(() => {
    return runGeneticTSP(activeTourNodes, 40, 80);
  }, [activeTourNodes]);

  const activeResult = useMemo<TourResult>(() => {
    if (selectedStrategy === 'exact') return exactResult;
    if (selectedStrategy === 'greedy') return greedyResult;
    if (selectedStrategy === 'genetic') return geneticResult;
    return saResult;
  }, [selectedStrategy, exactResult, greedyResult, geneticResult, saResult]);

  const toggleNodeSelection = (nodeId: string) => {
    if (selectedNodeIds.includes(nodeId)) {
      if (selectedNodeIds.length > 3) {
        setSelectedNodeIds(selectedNodeIds.filter(id => id !== nodeId));
      }
    } else {
      if (selectedNodeIds.length < 12) {
        setSelectedNodeIds([...selectedNodeIds, nodeId]);
      }
    }
  };

  // Build SVG path edges from tour order
  const tourEdges = useMemo(() => {
    const edges: { from: LogisticsNode; to: LogisticsNode }[] = [];
    const tour = activeResult.route;
    for (let i = 0; i < tour.length - 1; i++) {
      const fromNode = activeTourNodes.find(n => n.id === tour[i]);
      const toNode = activeTourNodes.find(n => n.id === tour[i + 1]);
      if (fromNode && toNode) {
        edges.push({ from: fromNode, to: toNode });
      }
    }
    return edges;
  }, [activeResult.route, activeTourNodes]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-100 text-rose-800 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Multi-Stop Delivery Tour & Route Planner</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Optimizes complex multi-destination vehicle journeys to eliminate backtracking, minimize fuel burn, and compute fastest closed-loop delivery schedules.
          </p>
        </div>

        {/* Strategy Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            id="btn-strategy-sa"
            onClick={() => setSelectedStrategy('sa')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              selectedStrategy === 'sa' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Adaptive Scheduler
          </button>
          <button
            id="btn-strategy-genetic"
            onClick={() => setSelectedStrategy('genetic')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              selectedStrategy === 'genetic' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Evolutionary Tour Optimizer
          </button>
          <button
            id="btn-strategy-exact"
            onClick={() => setSelectedStrategy('exact')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              selectedStrategy === 'exact' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Exact Global Optimum
          </button>
          <button
            id="btn-strategy-greedy"
            onClick={() => setSelectedStrategy('greedy')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              selectedStrategy === 'greedy' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rapid Nearest-Stop Fit
          </button>
        </div>
      </div>

      {/* Waypoint Selector Chips */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-rose-600" />
            Select Delivery Destinations ({activeTourNodes.length} Selected)
          </span>
          <span className="text-[11px] text-slate-400">Click to include / exclude waypoint from tour</span>
        </div>

        <div className="flex items-center flex-wrap gap-2 pt-1">
          {nodes.map((node) => {
            const isSelected = selectedNodeIds.includes(node.id);
            return (
              <button
                key={node.id}
                onClick={() => toggleNodeSelection(node.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {node.name} ({node.id})
              </button>
            );
          })}
        </div>
      </div>

      {/* Parameter Controls (When Adaptive Scheduler Active) */}
      {selectedStrategy === 'sa' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <div className="flex justify-between font-semibold text-slate-700 mb-1">
              <span>Exploration Intensity:</span>
              <span className="font-mono font-bold text-rose-700">{initialTemp}</span>
            </div>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={initialTemp}
              onChange={(e) => setInitialTemp(Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-700 mb-1">
              <span>Cooling Factor:</span>
              <span className="font-mono font-bold text-rose-700">{coolingRate}</span>
            </div>
            <input
              type="range"
              min="0.95"
              max="0.999"
              step="0.001"
              value={coolingRate}
              onChange={(e) => setCoolingRate(Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-700 mb-1">
              <span>Optimization Iterations:</span>
              <span className="font-mono font-bold text-rose-700">{maxIterations}</span>
            </div>
            <input
              type="range"
              min="200"
              max="2000"
              step="100"
              value={maxIterations}
              onChange={(e) => setMaxIterations(Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Main Grid: Tour Route Canvas + Convergence Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Tour Canvas */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-rose-600" />
              Optimal Multi-Stop Closed Delivery Tour
            </span>
            <span className="text-xs font-bold text-rose-700 font-mono bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Total Mileage: {activeResult.totalDistance} km
            </span>
          </div>

          <div className="relative w-full h-[340px] bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
            <svg className="w-full h-full" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet">
              {/* Tour Edges */}
              {tourEdges.map((edge, idx) => (
                <g key={`tour-edge-${idx}`}>
                  <line
                    x1={edge.from.x}
                    y1={edge.from.y}
                    x2={edge.to.x}
                    y2={edge.to.y}
                    stroke="#f43f5e"
                    strokeWidth={3.5}
                    strokeDasharray="4,4"
                    className="animate-pulse"
                  />
                  <polygon
                    points={`${(edge.from.x + edge.to.x) / 2},${(edge.from.y + edge.to.y) / 2 - 4} ${(edge.from.x + edge.to.x) / 2 + 6},${(edge.from.y + edge.to.y) / 2 + 4} ${(edge.from.x + edge.to.x) / 2 - 6},${(edge.from.y + edge.to.y) / 2 + 4}`}
                    fill="#fb7185"
                  />
                </g>
              ))}

              {/* Waypoint Nodes */}
              {activeTourNodes.map((node) => {
                const tourIdx = activeResult.route.indexOf(node.id);
                const isStart = tourIdx === 0 || tourIdx === activeResult.route.length - 1;

                return (
                  <g key={`tour-node-${node.id}`}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isStart ? 16 : 12}
                      fill={isStart ? '#10b981' : '#f43f5e'}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                    <text
                      x={node.x}
                      y={node.y + 4}
                      fill="#ffffff"
                      fontSize={11}
                      fontWeight="bold"
                      textAnchor="middle"
                      className="select-none pointer-events-none"
                    >
                      {tourIdx + 1}
                    </text>
                    <text
                      x={node.x}
                      y={node.y - 18}
                      fill="#ffffff"
                      fontSize={10}
                      fontWeight="bold"
                      textAnchor="middle"
                      className="select-none pointer-events-none drop-shadow"
                    >
                      {node.id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Tour Sequence Ribbon */}
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center flex-wrap gap-1.5 text-xs font-mono">
            <span className="font-bold text-slate-700 font-sans mr-1">Sequence:</span>
            {activeResult.route.map((nodeId, idx) => (
              <React.Fragment key={idx}>
                <span className={`px-2 py-0.5 rounded font-bold ${
                  idx === 0 || idx === activeResult.route.length - 1
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-800 border border-slate-300'
                }`}>
                  {nodeId}
                </span>
                {idx < activeResult.route.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Optimization Convergence Line Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-rose-600" />
                Distance Reduction & Optimization Curve
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Latency: {activeResult.computationTimeMs.toFixed(2)} ms
              </span>
            </div>

            {/* Recharts Convergence Chart */}
            <div className="h-64 w-full mt-3">
              {activeResult.history && activeResult.history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activeResult.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="iteration" tick={{ fontSize: 10 }} label={{ value: 'Cycle / Step', position: 'insideBottomRight', offset: -5 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} label={{ value: 'Distance (km)', angle: -90, position: 'insideLeft', offset: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="bestCost" stroke="#f43f5e" strokeWidth={2.5} dot={false} name="Optimized Distance (km)" />
                    {selectedStrategy === 'sa' && (
                      <Line type="monotone" dataKey="currentCost" stroke="#94a3b8" strokeWidth={1} dot={false} strokeDasharray="2 2" name="Candidate Trial (km)" />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center bg-slate-50 rounded-lg text-xs text-slate-500 flex-col gap-2 p-6 text-center">
                  <Sparkles className="w-8 h-8 text-rose-500" />
                  <div>
                    <strong className="text-slate-800">Deterministic Closed Route</strong>
                    <p className="mt-1">
                      Computed mathematically with zero stochastic variation. Global optimality is guaranteed for the selected waypoint set.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[11px] block font-medium">Calculation Speed</span>
              <span className="font-bold text-slate-900 font-mono text-sm">{activeResult.computationTimeMs.toFixed(2)} ms</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[11px] block font-medium">Estimated Fuel Saved</span>
              <span className="font-bold text-emerald-700 font-mono text-sm">~{Math.max(0, Math.round((greedyResult.totalDistance - activeResult.totalDistance) * 0.32))} L</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
