import React, { useState, useMemo } from 'react';
import { DeliveryOrder, OrderDecisionScore } from '../../types';
import { runWeightedScoring, DecisionCriteriaWeights, DEFAULT_CRITERIA_WEIGHTS } from '../../algorithms/decision/weightedScoring';
import { runKNNClassification, KNNClassificationResult } from '../../algorithms/decision/knnClassifier';
import { runRuleBasedExpertSystem, RuleEvaluationResult } from '../../algorithms/decision/ruleEngine';
import { 
  BrainCircuit, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  TrendingUp, 
  Layers, 
  Search,
  ShieldCheck,
  Zap,
  Tag,
  Target,
  FileCheck,
  Award,
  ListOrdered
} from 'lucide-react';

interface IntelligentDecisionViewProps {
  orders: DeliveryOrder[];
}

export const IntelligentDecisionView: React.FC<IntelligentDecisionViewProps> = ({
  orders
}) => {
  const [activeTab, setActiveTab] = useState<'scoring' | 'knn' | 'rules'>('scoring');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(() => orders[0]?.id || 'ORD-101');
  const [kValue, setKValue] = useState<number>(3);

  // Criteria Weights state (AHP / Weighted Scoring)
  const [weights, setWeights] = useState<DecisionCriteriaWeights>(DEFAULT_CRITERIA_WEIGHTS);

  // 1. Multi-Criteria Scoring Output
  const scoringOutput = useMemo(() => {
    return runWeightedScoring(orders, weights);
  }, [orders, weights]);

  // 2. k-NN Classification Output
  const knnOutput = useMemo(() => {
    return runKNNClassification(orders, kValue);
  }, [orders, kValue]);

  // 3. Rule-Based Inference Output
  const ruleOutput = useMemo(() => {
    return runRuleBasedExpertSystem(orders);
  }, [orders]);

  const activeSelectedOrder = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId) || orders[0];
  }, [orders, selectedOrderId]);

  const selectedScored = useMemo(() => {
    return scoringOutput?.scores?.find(s => s.orderId === selectedOrderId);
  }, [scoringOutput, selectedOrderId]);

  const selectedKnn = useMemo(() => {
    return knnOutput?.classifications?.find(k => k.orderId === selectedOrderId);
  }, [knnOutput, selectedOrderId]);

  const selectedRule = useMemo(() => {
    return ruleOutput?.results?.find(r => r.orderId === selectedOrderId);
  }, [ruleOutput, selectedOrderId]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Intelligent Decision Support & Order Triage</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Multi-criteria prioritization engine combining Weighted Scoring, k-Nearest Neighbors classification, and Rule-Based compliance inference.
          </p>
        </div>

        {/* Engine Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            id="btn-tab-scoring"
            onClick={() => setActiveTab('scoring')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'scoring' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            Weighted Scoring Model
          </button>
          <button
            id="btn-tab-knn"
            onClick={() => setActiveTab('knn')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'knn' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            k-NN Classifier (k={kValue})
          </button>
          <button
            id="btn-tab-rules"
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'rules' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            Rule-Based Expert Engine
          </button>
        </div>
      </div>

          {/* Control Sliders (When Multi-Criteria Priority Scoring Active) */}
      {activeTab === 'scoring' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-600" />
              Dynamic Criteria Weight Calibration
            </h2>
            <span className="text-[11px] font-mono text-slate-500">
              Normalized Weights (Sum: {(weights.urgencyWeight + weights.valueWeight + weights.tierWeight + weights.perishabilityWeight + weights.fragilityWeight).toFixed(2)})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Deadline Urgency</span>
                <span className="text-amber-700 font-mono font-bold">{(weights.urgencyWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.6"
                step="0.05"
                value={weights.urgencyWeight}
                onChange={(e) => setWeights({ ...weights, urgencyWeight: parseFloat(e.target.value) })}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Cargo Item Value</span>
                <span className="text-amber-700 font-mono font-bold">{(weights.valueWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.6"
                step="0.05"
                value={weights.valueWeight}
                onChange={(e) => setWeights({ ...weights, valueWeight: parseFloat(e.target.value) })}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Customer SLA Tier</span>
                <span className="text-amber-700 font-mono font-bold">{(weights.tierWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.6"
                step="0.05"
                value={weights.tierWeight}
                onChange={(e) => setWeights({ ...weights, tierWeight: parseFloat(e.target.value) })}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Perishability Penalty</span>
                <span className="text-amber-700 font-mono font-bold">{(weights.perishabilityWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.6"
                step="0.05"
                value={weights.perishabilityWeight}
                onChange={(e) => setWeights({ ...weights, perishabilityWeight: parseFloat(e.target.value) })}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Fragility Care</span>
                <span className="text-amber-700 font-mono font-bold">{(weights.fragilityWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.6"
                step="0.05"
                value={weights.fragilityWeight}
                onChange={(e) => setWeights({ ...weights, fragilityWeight: parseFloat(e.target.value) })}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

            {/* Pattern Neighborhood Control (When Pattern Classifier Active) */}
      {activeTab === 'knn' && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <span className="font-bold text-amber-900">k-NN Nearest Neighbors (k):</span>
            <div className="flex items-center gap-2">
              {[1, 3, 5, 7].map(val => (
                <button
                  key={val}
                  onClick={() => setKValue(val)}
                  className={`px-3 py-1 rounded font-bold transition-all ${
                    kValue === val ? 'bg-amber-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-amber-300'
                  }`}
                >
                  k = {val}
                </button>
              ))}
            </div>
          </div>
          <div className="text-[11px] text-amber-800">
            Euclidean feature vector matching on normalized deadline, value, weight, and customer tier.
          </div>
        </div>
      )}

    {/* Main Grid: Orders Table + Decision Explanation Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900">
              {activeTab === 'scoring' ? 'Priority Ranked Consignments (Sorted by Score)' : activeTab === 'knn' ? 'k-NN Classified Orders' : 'Rule-Based Safety & Dispatch Manifest'}
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">
              Latency: {activeTab === 'scoring' ? `${scoringOutput.metrics.executionTimeMs}ms` : activeTab === 'knn' ? `${knnOutput.metrics.executionTimeMs}ms` : `${ruleOutput.metrics.executionTimeMs}ms`}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                  <th className="py-2.5 px-3">Order ID & Customer</th>
                  <th className="py-2.5 px-3">SLA / Value</th>
                  <th className="py-2.5 px-3">Cargo Spec</th>
                  <th className="py-2.5 px-3">
                    {activeTab === 'scoring' ? 'Calculated Priority' : activeTab === 'knn' ? 'Predicted Category' : 'Compliance Directives'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const isSelected = activeSelectedOrder && activeSelectedOrder.id === order.id;
                  const scored = scoringOutput.scores.find(s => s.orderId === order.id);
                  const knn = knnOutput.classifications.find(k => k.orderId === order.id);
                  const rule = ruleOutput.results.find(r => r.orderId === order.id);

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-amber-50/80 font-medium' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{order.customerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{order.id} • Tier {order.customerTier}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        <div className="text-slate-800">Rs. {order.itemValue.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-500">{order.deadlineHours} hrs SLA</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <div>{order.weightKg} kg • {order.volumeM3} m³</div>
                        {order.isPerishable && (
                          <span className="text-[10px] font-bold text-rose-600">Perishable Cargo</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {activeTab === 'scoring' && scored && (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-700 font-mono text-xs">
                              {scored.compositeScore.toFixed(1)}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                              scored.priorityRank <= 3 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              Rank #{scored.priorityRank}
                            </span>
                          </div>
                        )}

                        {activeTab === 'knn' && knn && (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            knn.predictedLabel === 'CRITICAL_EXPRESS' ? 'bg-rose-100 text-rose-700' :
                            knn.predictedLabel === 'HIGH_PRIORITY' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {knn.predictedLabel} ({knn.confidenceScore}%)
                          </span>
                        )}

                        {activeTab === 'rules' && rule && (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            rule.triggeredRules.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {rule.triggeredRules.length > 0 ? `${rule.triggeredRules.length} Directive(s)` : 'Standard Dispatch'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        </div>
      </div>
        );
     };