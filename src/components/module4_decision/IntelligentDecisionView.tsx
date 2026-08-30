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



        </div>
      </div>
        );
     };