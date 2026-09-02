import React, { useState, useMemo } from 'react';
import { DeliveryOrder, Vehicle, Driver } from '../../types';
import { runGreedyAllocation } from '../../algorithms/allocation/greedyAllocation';
import { runKnapsackDP, KnapsackDPResult } from '../../algorithms/allocation/knapsackDP';
import { runGeneticAllocation, GeneticAllocationResult } from '../../algorithms/allocation/geneticAllocation';
import { 
  Truck, 
  UserCheck, 
  DollarSign, 
  Scale, 
  BarChart2, 
  Sparkles, 
  Table, 
  Clock,
  Layers,
  Cpu
} from 'lucide-react';

interface ResourceAllocationViewProps {
  orders: DeliveryOrder[];
  vehicles: Vehicle[];
  drivers: Driver[];
}

export const ResourceAllocationView: React.FC<ResourceAllocationViewProps> = ({
  orders,
  vehicles,
  drivers
}) => {
  // Tracks which allocation algorithm is currently selected in the UI.
  const [selectedStrategy, setSelectedStrategy] = useState<'greedy' | 'knapsack' | 'genetic'>('knapsack');
  // Stores the number of optimization cycles used by the genetic algorithm.
  const [optCycles, setOptCycles] = useState<number>(30);
  // Controls the candidate sample pool size for genetic allocation.
  const [sampleSize, setSampleSize] = useState<number>(40);

  // Compute results
  // Memoize greedy allocation so it only recalculates when fleet inputs change.
  const greedyResult = useMemo(() => {
    return runGreedyAllocation(orders, vehicles, drivers);
  }, [orders, vehicles, drivers]);

  // Compute the dynamic-programming allocation for maximum cargo value.
  const knapsackResult = useMemo<KnapsackDPResult>(() => {
    return runKnapsackDP(orders, vehicles, drivers);
  }, [orders, vehicles, drivers]);

  // Run the genetic allocator using the current tuning parameters.
  const geneticResult = useMemo<GeneticAllocationResult>(() => {
    return runGeneticAllocation(orders, vehicles, drivers, sampleSize, optCycles);
  }, [orders, vehicles, drivers, sampleSize, optCycles]);

  // Select the result set that should currently be rendered.
  const activeResult = useMemo(() => {
    if (selectedStrategy === 'greedy') return greedyResult;
    if (selectedStrategy === 'genetic') return geneticResult;
    return knapsackResult;
  }, [selectedStrategy, greedyResult, knapsackResult, geneticResult]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Fleet Resource Allocation Studio</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Optimizes vehicle payload loading and certified driver assignments, maximizing delivered cargo value within strict weight, volume, and customer SLA limits.
          </p>
        </div>

        {/* Allocation Strategy Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            id="btn-alloc-knapsack"
            onClick={() => setSelectedStrategy('knapsack')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              selectedStrategy === 'knapsack' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Max Value Optimizer
          </button>
          <button
            id="btn-alloc-greedy"
            onClick={() => setSelectedStrategy('greedy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              selectedStrategy === 'greedy' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Rapid Priority Fit
          </button>
          <button
            id="btn-alloc-genetic"
            onClick={() => setSelectedStrategy('genetic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              selectedStrategy === 'genetic' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" /> Multi-Fleet Balancer
          </button>
        </div>
      </div>

      {/* Parameter Toolbar (When Multi-Fleet Balancer selected) */}
      {selectedStrategy === 'genetic' && (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-700" /> Multi-Constraint Balancing Parameters:
            </span>
            <div className="flex items-center gap-2">
              <label className="text-slate-700 font-medium">Sample Pool Size:</label>
              <input
                type="number"
                value={sampleSize}
                onChange={(e) => setSampleSize(Math.max(10, Math.min(100, Number(e.target.value))))}
                className="w-16 bg-white border border-emerald-300 rounded px-2 py-1 font-bold text-center text-emerald-900"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-700 font-medium">Optimization Cycles:</label>
              <input
                type="number"
                value={optCycles}
                onChange={(e) => setOptCycles(Math.max(5, Math.min(100, Number(e.target.value))))}
                className="w-16 bg-white border border-emerald-300 rounded px-2 py-1 font-bold text-center text-emerald-900"
              />
            </div>
          </div>
          <div className="text-[11px] text-emerald-800">
            Balancing engine evaluates multi-vehicle distribution and SLA deadlines
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Total Loaded Cargo Value
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            Rs. {activeResult.totalValueDelivered.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {activeResult.metrics.solutionQualityScore}% of pending consignments
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-blue-600" /> Dispatched Weight
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {activeResult.totalWeightAllocated.toLocaleString()} kg
          </div>
          <div className="text-[11px] text-slate-500">Across active fleet</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-purple-600" /> Fleet Capacity Utilization
          </div>
          <div className="text-xl font-bold text-purple-700 mt-1">
            {activeResult.averageUtilizationPct}%
          </div>
          <div className="text-[11px] text-slate-500">Payload volume efficiency</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Dispatch Response Time
          </div>
          <div className="text-xl font-bold text-amber-600 mt-1">
            {activeResult.metrics.executionTimeUs} μs
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            Sub-millisecond resolution
          </div>
        </div>
      </div>

      {/* Fleet Assignment Grid */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-600" />
          Active Vehicle Dispatch & Cargo Manifest
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeResult.assignments.map((assignment, idx) => {
            // Flag highly utilized vehicles for alternate visual styling.
            const isFull = assignment.capacityUtilizationPct > 90;
            return (
              <div
                key={`assign-${idx}`}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-emerald-300 transition-all"
              >
                {/* Vehicle Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{assignment.vehicle.name}</div>
                    <div className="text-xs text-slate-500">
                      {assignment.vehicle.type} • Max {assignment.vehicle.capacityKg}kg / {assignment.vehicle.volumeM3}m³
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                    {assignment.vehicle.id}
                  </span>
                </div>

                {/* Driver Tag */}
                {assignment.driver && (
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-slate-800">{assignment.driver.name}</span>
                    </div>
                    <span className="text-slate-500 text-[11px]">
                      ⭐ {assignment.driver.rating} • {assignment.driver.experienceYears}y exp
                    </span>
                  </div>
                )}

                {/* Utilization Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">Weight Utilization</span>
                    <span className={`font-bold font-mono ${isFull ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {assignment.totalWeightKg} / {assignment.vehicle.capacityKg} kg ({assignment.capacityUtilizationPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFull ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, assignment.capacityUtilizationPct)}%` }}
                    />
                  </div>
                </div>

                {/* Assigned Orders List */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Loaded Consignments ({assignment.orders.length})</span>
                    <span className="text-emerald-700 font-mono">Rs. {assignment.totalValueDelivered.toLocaleString()}</span>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {/* Render assigned consignments, or an empty-state message when none exist. */
                      assignment.orders.length > 0 ? (
                      assignment.orders.map((o) => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded border border-slate-100"
                        >
                          <div>
                            <div className="font-semibold text-slate-800">{o.customerName.split(' ')[0]}</div>
                            <div className="text-[10px] text-slate-500">
                              {o.id} • {o.weightKg}kg • {o.deadlineHours}h SLA
                            </div>
                          </div>
                          <span className="font-bold text-emerald-700 font-mono text-[11px]">
                            Rs. {o.itemValue.toLocaleString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400 italic py-2 text-center">
                        No orders assigned to this vehicle
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payload Value Optimization Grid */}
      {selectedStrategy === 'knapsack' && knapsackResult.dpTablePreview && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Table className="w-4 h-4 text-blue-600" />
                Payload Value Optimization Grid (Cargo vs Capacity kg)
              </h3>
              <p className="text-xs text-slate-500">
                Calculates maximum cargo revenue across discrete payload weight increments (50 kg steps).
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-medium">
              Guaranteed Value Maximization
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="py-2 px-3 text-left font-bold">Consignment / Capacity (kg)</th>
                  {knapsackResult.dpTablePreview.capacityHeaders.map((cap) => (
                    <th key={cap} className="py-2 px-3 font-mono font-semibold text-slate-800">
                      {cap}kg
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {/* Render each row of the DP preview matrix for the selected consignments. */
                knapsackResult.dpTablePreview.matrix.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="py-2 px-3 text-left font-sans font-semibold text-slate-800 whitespace-nowrap">
                      {knapsackResult.dpTablePreview.itemLabels[rIdx]}
                    </td>
                    {row.map((val, cIdx) => (
                      <td
                        key={cIdx}
                        className={`py-2 px-3 ${
                          val > 0 ? 'text-emerald-700 font-bold bg-emerald-50/40' : 'text-slate-400'
                        }`}
                      >
                        Rs. {val.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
