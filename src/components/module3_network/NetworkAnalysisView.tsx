import React, { useState, useMemo } from 'react';
import { Graph } from '../../dataStructures/Graph';
import { LogisticsNode, LogisticsEdge } from '../../types';
import {
  calculateNetworkCentralities,
  CentralityAnalysisResult
} from '../../algorithms/network/centrality';
import {
  runNetworkTraversal,
  ConnectivityResult
} from '../../algorithms/network/bfsDfs';

import {
  Share2,
  Flame,
  Activity,
  CheckCircle,
  Search,
  Network,
  ShieldAlert
} from 'lucide-react';

interface NetworkAnalysisViewProps {
  graph: Graph;
  nodes: LogisticsNode[];
  edges: LogisticsEdge[];
}

export const NetworkAnalysisView: React.FC<NetworkAnalysisViewProps> = ({
  graph,
  nodes,
  edges
}) => {
  const [metricView, setMetricView] = useState<
    'betweenness' | 'closeness' | 'degree'
  >('betweenness');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Calculate network centrality metrics
  const centralityResult: CentralityAnalysisResult = useMemo(() => {
    return calculateNetworkCentralities(graph);
  }, [graph]);

  // Calculate network connectivity
  const connectivityResult: ConnectivityResult = useMemo(() => {
    return runNetworkTraversal(graph);
  }, [graph]);

  // Filter centrality results based on search
  const filteredCentralities = useMemo(() => {
    return centralityResult.centralities.filter((c) =>
      c.nodeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nodeId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [centralityResult, searchQuery]);

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

        <div>
          <div className="flex items-center gap-2">

            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <Share2 className="w-5 h-5" />
            </div>

            <h1 className="text-xl font-bold text-slate-900">
              Supply Chain Network Intelligence Studio
            </h1>

          </div>

          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Evaluates transportation infrastructure connectivity,
            identifies critical transit bottlenecks, and detects
            vulnerable single-point-of-failure corridors.
          </p>
        </div>

        {/* Metric Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">

          <button
            id="btn-metric-betweenness"
            onClick={() => setMetricView('betweenness')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              metricView === 'betweenness'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Transit Bottlenecks
          </button>

          <button
            id="btn-metric-closeness"
            onClick={() => setMetricView('closeness')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              metricView === 'closeness'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Network Reachability
          </button>

          <button
            id="btn-metric-degree"
            onClick={() => setMetricView('degree')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              metricView === 'degree'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Direct Connectivity
          </button>

        </div>
      </div>

      {/* Network Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Infrastructure Status */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">

          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5 text-blue-600" />
            Infrastructure Status
          </div>

          <div className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">

            {connectivityResult.isFullyConnected
              ? 'Fully Connected'
              : 'Segmented'}

            {connectivityResult.isFullyConnected && (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            )}

          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            {connectivityResult.componentCount} Active Network Sector(s)
          </div>

        </div>

        {/* Top Transit Bottleneck */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">

          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            Top Transit Bottleneck
          </div>

          <div className="text-xl font-bold text-rose-700 mt-1 truncate">
            {centralityResult.mostCriticalHub?.nodeName.split(' ')[0] || 'N/A'}
          </div>

          <div className="text-[11px] text-slate-500">
            Carries{' '}
            {Math.round(
              (centralityResult.mostCriticalHub?.betweennessCentrality || 0) *
                100
            )}
            % of network transit
          </div>

        </div>

        {/* Critical Corridors */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">

          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            Single-Point-of-Failure Links
          </div>

          <div className="text-xl font-bold text-amber-700 mt-1">
            {connectivityResult.bridges.length} Critical Corridors
          </div>

          <div className="text-[11px] text-slate-500">
            Requires backup redundancy
          </div>

        </div>

        {/* Network Density */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">

          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-purple-600" />
            Network Span & Density
          </div>

          <div className="text-xl font-bold text-purple-700 mt-1">
            {connectivityResult.graphDiameter} Max Transit Hops
          </div>

          <div className="text-[11px] text-slate-500">
            {edges.length} Active Corridors
            {' '}
            (Density:{' '}
            {Math.round(connectivityResult.graphDensity * 100)}%)
          </div>

        </div>

      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Network Analysis Placeholder */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">

          <div className="flex items-center justify-between pb-3 border-b border-slate-100">

            <div className="flex items-center gap-2">

              <Activity className="w-4 h-4 text-purple-600" />

              <span className="text-xs font-bold text-slate-800">
                Network Analysis
              </span>

            </div>

            <span className="text-[11px] text-slate-500">
              {metricView === 'betweenness'
                ? 'Transit Traffic Bottleneck'
                : metricView === 'closeness'
                ? 'Network Reachability'
                : 'Direct Link Density'}
            </span>

          </div>

          <div className="h-[420px] flex items-center justify-center bg-slate-50 rounded-lg mt-4 border border-slate-200">

            <div className="text-center">

              <Network className="w-12 h-12 text-purple-400 mx-auto mb-3" />

              <h3 className="text-sm font-bold text-slate-700">
                Network Topology Analysis
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                Interactive topology visualization will be added in the
                network visualization stage.
              </p>

              <p className="text-[11px] text-slate-400 mt-2">
                {nodes.length} Nodes • {edges.length} Corridors
              </p>

            </div>

          </div>

        </div>

        {/* Centrality Leaderboard */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col space-y-3">

          <div>

            <div className="flex items-center justify-between mb-2">

              <h3 className="text-xs font-bold text-slate-900">
                Hub Criticality Leaderboard
              </h3>

              <div className="relative w-36">

                <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400" />

                <input
                  type="text"
                  placeholder="Search hub..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                />

              </div>

            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">

              {filteredCentralities.map((item) => {

                const isSelected = selectedNodeId === item.nodeId;

                return (
                  <div
                    key={item.nodeId}
                    onClick={() => setSelectedNodeId(item.nodeId)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-50 border-purple-300 shadow-sm'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                    }`}
                  >

                    <div className="flex items-center justify-between font-bold">

                      <div className="flex items-center gap-2">

                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-mono">
                          #{item.rank}
                        </span>

                        <span className="text-slate-900">
                          {item.nodeName}
                        </span>

                      </div>

                      <span className="text-purple-700 font-mono font-bold text-[11px]">
                        {item.nodeId}
                      </span>

                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">

                      <div>
                        <span className="text-[10px] text-slate-400 block">
                          Bottleneck Index
                        </span>

                        <span className="font-semibold text-purple-800">
                          {item.betweennessCentrality}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block">
                          Reachability
                        </span>

                        <span className="font-semibold text-slate-800">
                          {item.closenessCentrality}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block">
                          Connected Links
                        </span>

                        <span className="font-semibold text-slate-800">
                          {item.degreeCentrality} corridors
                        </span>
                      </div>

                    </div>

                  </div>
                );
              })}

            </div>

          </div>

          <div className="text-[11px] text-slate-500 text-center border-t border-slate-100 pt-2 font-medium">
            Proactive redundancy recommendations generated for hubs ranked
            top 3
          </div>

        </div>

      </div>

    </div>
  );
};