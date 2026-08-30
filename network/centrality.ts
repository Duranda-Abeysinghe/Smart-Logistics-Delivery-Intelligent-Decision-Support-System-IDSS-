import { Graph } from '../../dataStructures/Graph';
import { CentralityResult, AlgorithmMetrics } from '../../types';

export interface CentralityAnalysisResult {
  centralities: CentralityResult[];
  mostCriticalHub: CentralityResult | null;
  bottleneckBridgeNodes: string[];
  metrics: AlgorithmMetrics;
}

/**
 * Computes Degree, Closeness, and Betweenness Centrality (Brandes' Algorithm)
 * Time Complexity: O(V * E) for Betweenness (Brandes), O(V * (V + E)) for Closeness
 * Space Complexity: O(V + E)
 */
export function calculateNetworkCentralities(graph: Graph): CentralityAnalysisResult {
  const startTime = performance.now();

  const nodes = graph.getAllNodes();
  const nodeIds = graph.getAllNodeIds();
  const n = nodeIds.length;

  // Initialize centrality metrics
  const degreeMap = new Map<string, number>();
  const closenessMap = new Map<string, number>();
  const betweennessMap = new Map<string, number>();

  for (const id of nodeIds) {
    degreeMap.set(id, 0);
    closenessMap.set(id, 0);
    betweennessMap.set(id, 0);
  }

  // 1. Degree Centrality
  for (const id of nodeIds) {
    const deg = graph.getDegree(id);
    degreeMap.set(id, deg);
  }

  // 2. Closeness Centrality & 3. Betweenness Centrality using Brandes' Algorithm
  for (const s of nodeIds) {
    const stack: string[] = [];
    const pred = new Map<string, string[]>();
    const sigma = new Map<string, number>();
    const dist = new Map<string, number>();
    const delta = new Map<string, number>();

    for (const v of nodeIds) {
      pred.set(v, []);
      sigma.set(v, 0);
      dist.set(v, -1);
      delta.set(v, 0);
    }

    sigma.set(s, 1);
    dist.set(s, 0);

    const queue: string[] = [s];

    // BFS Shortest paths from source s
    while (queue.length > 0) {
      const v = queue.shift()!;
      stack.push(v);

      for (const edge of graph.getNeighbors(v)) {
        if (edge.isBlocked) continue;
        const w = edge.target;

        // Path discovery
        if (dist.get(w)! < 0) {
          dist.set(w, dist.get(v)! + 1);
          queue.push(w);
        }

        // Path counting
        if (dist.get(w) === dist.get(v)! + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          pred.get(w)!.push(v);
        }
      }
    }

    }
