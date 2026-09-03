import { Graph } from '../../dataStructures/Graph';
import { LogisticsNode, LogisticsEdge, DeliveryOrder, Vehicle, Driver } from '../../types';
import { runDijkstra } from '../route/dijkstra';
import { runAStar } from '../route/aStar';
import { runBellmanFord } from '../route/bellmanFord';
import { runGreedyAllocation } from '../allocation/greedyAllocation';
import { runKnapsackDP } from '../allocation/knapsackDP';
import { runGeneticAllocation } from '../allocation/geneticAllocation';
import { calculateNetworkCentralities } from '../network/centrality';
import { runWeightedScoring } from '../decision/weightedScoring';
import { runKNNClassification } from '../decision/knnClassifier';
import { runGreedyTSP } from '../optimization/greedyTSP';
import { runSimulatedAnnealing } from '../optimization/simulatedAnnealing';

// =============================================================================
// Benchmark Suite
//
// Measures real, live execution time of each algorithm running against the
// ACTUAL dataset loaded from the MySQL database (nodes, edges, vehicles,
// drivers, orders). This intentionally does NOT synthesize or randomly
// generate any locations/orders/fleet data - every timing here is a genuine
// measurement taken against whatever is currently stored in the database.
// =============================================================================

export interface BenchmarkPoint {
  datasetSize: number;
  algorithmName: string;
  module: string;
  executionTimeMs: number;
  theoreticalComplexity: string;
  spaceComplexity: string;
  memoryEstimateKb: number;
}

export interface BenchmarkSummaryItem {
  task: string;
  algorithm: string;
  liveTimeMs: number;
  theoreticalComplexity: string;
  spaceComplexity: string;
  suitabilityRecommendation: string;
}

export interface BenchmarkSuiteResult {
  points: BenchmarkPoint[];
  summaryMatrix: BenchmarkSummaryItem[];
  datasetSize: number;
  orderCount: number;
}

export interface BenchmarkInputDataset {
  graph: Graph;
  nodes: LogisticsNode[];
  edges: LogisticsEdge[];
  orders: DeliveryOrder[];
  vehicles: Vehicle[];
  drivers: Driver[];
}

export function runFullBenchmarkSuite(dataset: BenchmarkInputDataset): BenchmarkSuiteResult {
  const { graph, nodes, orders, vehicles, drivers } = dataset;
  const size = nodes.length;
  const points: BenchmarkPoint[] = [];

  const startNode = nodes[0]?.id;
  const targetNode = nodes[nodes.length - 1]?.id;

  const suitability: Record<string, string> = {
    'Express Direct Routing': 'Best for point-to-point dispatch with geographical hub coordinates.',
    'Cost-Optimal Dispatch': 'Standard baseline for single-origin scheduled fleet distribution.',
    'Toll-Aware Multi-Terrain': 'Handles negative/discounted edge weights for toll-aware routing.',
    'Rapid Priority Fit': 'Real-time instantaneous dispatch for time-critical fleet assignment.',
    'Max Value Optimizer': 'Guarantees global mathematical revenue maximum for vehicle payload packing.',
    'Multi-Fleet Balancer': 'Effective for complex multi-vehicle fleet balancing with driver shift constraints.',
    'Bottleneck Vulnerability Analytics': 'Standard enterprise analytics for identifying critical logistics hub bottlenecks.',
    'Multi-Criteria Priority Scoring': 'Extremely fast, transparent, and explainable for dispatch operations.',
    'Historical Pattern Classifier': 'Classifies order urgency by similarity to nearest historical orders.',
    'Rapid Nearest-Stop Fit': 'Fast approximate multi-stop sequencing for quick dispatch previews.',
    'Adaptive Tour Scheduler': 'Optimal trade-off between execution speed and route quality for multi-stop tours.',
  };

  if (startNode && targetNode) {
    // 1. Route Optimization
    const dijkstraRes = runDijkstra(graph, startNode, targetNode);
    points.push({
      datasetSize: size,
      algorithmName: 'Cost-Optimal Dispatch',
      module: 'Routing',
      executionTimeMs: dijkstraRes.metrics.executionTimeMs,
      theoreticalComplexity: 'Linear-Logarithmic O((V+E) log V)',
      spaceComplexity: 'O(V)',
      memoryEstimateKb: size * 0.2
    });

    const aStarRes = runAStar(graph, startNode, targetNode);
    points.push({
      datasetSize: size,
      algorithmName: 'Express Direct Routing',
      module: 'Routing',
      executionTimeMs: aStarRes.metrics.executionTimeMs,
      theoreticalComplexity: 'Directional Heuristic O((V+E) log V)',
      spaceComplexity: 'O(V)',
      memoryEstimateKb: size * 0.25
    });

    const bellmanRes = runBellmanFord(graph, startNode, targetNode);
    points.push({
      datasetSize: size,
      algorithmName: 'Toll-Aware Multi-Terrain',
      module: 'Routing',
      executionTimeMs: bellmanRes.metrics.executionTimeMs,
      theoreticalComplexity: 'Polynomial O(V · E)',
      spaceComplexity: 'O(V)',
      memoryEstimateKb: size * 0.3
    });
  }

  // 2. Resource Allocation (against the real orders/vehicles/drivers currently in the DB)
  if (orders.length > 0 && vehicles.length > 0) {
    const greedyAllocRes = runGreedyAllocation(orders, vehicles, drivers);
    points.push({
      datasetSize: orders.length,
      algorithmName: 'Rapid Priority Fit',
      module: 'Allocation',
      executionTimeMs: greedyAllocRes.metrics.executionTimeMs,
      theoreticalComplexity: 'Sub-Millisecond O(N log N)',
      spaceComplexity: 'O(N)',
      memoryEstimateKb: orders.length * 0.15
    });

    const knapsackRes = runKnapsackDP(orders, vehicles, drivers);
    points.push({
      datasetSize: orders.length,
      algorithmName: 'Max Value Optimizer',
      module: 'Allocation',
      executionTimeMs: knapsackRes.metrics.executionTimeMs,
      theoreticalComplexity: 'Exact Combinatorial O(N · W)',
      spaceComplexity: 'O(N · W)',
      memoryEstimateKb: orders.length * 1.5
    });

    const geneticAllocRes = runGeneticAllocation(orders, vehicles, drivers, 30, 20);
    points.push({
      datasetSize: orders.length,
      algorithmName: 'Multi-Fleet Balancer',
      module: 'Allocation',
      executionTimeMs: geneticAllocRes.metrics.executionTimeMs,
      theoreticalComplexity: 'Iterative Balancing O(G · P · N)',
      spaceComplexity: 'O(P · N)',
      memoryEstimateKb: orders.length * 0.8
    });
  }

  // 3. Network Analysis
  if (size > 0) {
    const centralityRes = calculateNetworkCentralities(graph);
    points.push({
      datasetSize: size,
      algorithmName: 'Bottleneck Vulnerability Analytics',
      module: 'Network',
      executionTimeMs: centralityRes.metrics.executionTimeMs,
      theoreticalComplexity: 'Network Flow O(V · E)',
      spaceComplexity: 'O(V + E)',
      memoryEstimateKb: size * size * 0.05
    });
  }

  // 4. Decision Module
  if (orders.length > 0) {
    const weightedRes = runWeightedScoring(orders);
    points.push({
      datasetSize: orders.length,
      algorithmName: 'Multi-Criteria Priority Scoring',
      module: 'Decision',
      executionTimeMs: weightedRes.metrics.executionTimeMs,
      theoreticalComplexity: 'Real-Time Vector O(N · K)',
      spaceComplexity: 'O(N)',
      memoryEstimateKb: orders.length * 0.1
    });

    const knnRes = runKNNClassification(orders, Math.max(1, Math.min(3, orders.length - 1)));
    points.push({
      datasetSize: orders.length,
      algorithmName: 'Historical Pattern Classifier',
      module: 'Decision',
      executionTimeMs: knnRes.metrics.executionTimeMs,
      theoreticalComplexity: 'Pattern Similarity O(N · D)',
      spaceComplexity: 'O(N)',
      memoryEstimateKb: orders.length * 0.2
    });
  }

  // 5. Optimization Module (multi-stop tour over the real hub set)
  if (size > 1) {
    const optSubset = nodes;
    const greedyTSPRes = runGreedyTSP(optSubset);
    points.push({
      datasetSize: optSubset.length,
      algorithmName: 'Rapid Nearest-Stop Fit',
      module: 'Optimization',
      executionTimeMs: greedyTSPRes.computationTimeMs,
      theoreticalComplexity: 'Greedy Sequence O(N²)',
      spaceComplexity: 'O(N)',
      memoryEstimateKb: optSubset.length * 0.1
    });

    const saRes = runSimulatedAnnealing(optSubset, 500, 0.98, 200);
    points.push({
      datasetSize: optSubset.length,
      algorithmName: 'Adaptive Tour Scheduler',
      module: 'Optimization',
      executionTimeMs: saRes.computationTimeMs,
      theoreticalComplexity: 'Metropolis Cooling O(Iter · N)',
      spaceComplexity: 'O(N)',
      memoryEstimateKb: optSubset.length * 0.2
    });
  }

  // Summary matrix is derived directly from the live measurements above -
  // no hardcoded or simulated timing figures.
  const summaryMatrix: BenchmarkSummaryItem[] = points.map(p => ({
    task: p.module,
    algorithm: p.algorithmName,
    liveTimeMs: parseFloat(p.executionTimeMs.toFixed(4)),
    theoreticalComplexity: p.theoreticalComplexity,
    spaceComplexity: p.spaceComplexity,
    suitabilityRecommendation: suitability[p.algorithmName] || 'General-purpose engine for this decision module.'
  }));

  return { points, summaryMatrix, datasetSize: size, orderCount: orders.length };
}
