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
  
// Calculate shortest paths and centrality values for each node.
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

    // Accumulate closeness distance
    let totalDistFromS = 0;
    let reachableCount = 0;
    for (const v of nodeIds) {
      const d = dist.get(v)!;
      if (d > 0) {
        totalDistFromS += d;
        reachableCount++;
      }
    }

    if (totalDistFromS > 0 && reachableCount > 0) {
      // Wasserman & Faust formula for disconnected networks
      const rawCloseness = reachableCount / totalDistFromS;
      const normalizedCloseness = (reachableCount / (n - 1)) * rawCloseness;
      closenessMap.set(s, normalizedCloseness);
    }

    // Accumulation: Back-propagation of dependencies via stack
    while (stack.length > 0) {
      const w = stack.pop()!;
      for (const v of pred.get(w)!) {
        const c = (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!);
        delta.set(v, delta.get(v)! + c);
      }
      if (w !== s) {
        betweennessMap.set(w, betweennessMap.get(w)! + delta.get(w)!);
      }
    }
  }

  // Normalize betweenness for undirected graph: divide by (n-1)(n-2)
  const normFactor = n > 2 ? (n - 1) * (n - 2) : 1;
  const results: CentralityResult[] = nodes.map(node => {
    const deg = degreeMap.get(node.id) || 0;
    const normDeg = n > 1 ? deg / (n - 1) : 0;
    const closeness = closenessMap.get(node.id) || 0;
    const rawBetweenness = betweennessMap.get(node.id) || 0;
    // Undirected graph accounts for each pair twice
    const normBetweenness = (rawBetweenness / 2) / (normFactor / 2);

    return {
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      degreeCentrality: deg,
      normalizedDegree: Math.round(normDeg * 1000) / 1000,
      closenessCentrality: Math.round(closeness * 1000) / 1000,
      betweennessCentrality: Math.round(normBetweenness * 10000) / 10000,
      eccentricity: 0,
      rank: 0
    };
  });

  // Sort and rank by composite centrality
  results.sort((a, b) => {
    const scoreB = b.betweennessCentrality * 0.5 + b.closenessCentrality * 0.3 + b.normalizedDegree * 0.2;
    const scoreA = a.betweennessCentrality * 0.5 + a.closenessCentrality * 0.3 + a.normalizedDegree * 0.2;
    return scoreB - scoreA;
  });

  results.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  const bottleneckBridgeNodes = results
    .filter(r => r.betweennessCentrality > 0.15)
    .map(r => r.nodeId);

  const endTime = performance.now();
  const executionTimeMs = endTime - startTime;

  return {
    centralities: results,
    mostCriticalHub: results[0] || null,
    bottleneckBridgeNodes,
    metrics: {
      algorithmName: "Brandes' Betweenness & Closeness Centrality",
      executionTimeMs: Math.round(executionTimeMs * 1000) / 1000,
      executionTimeUs: Math.round(executionTimeMs * 1000),
      nodesVisited: n * n,
      timeComplexity: 'O(V * E)',
      spaceComplexity: 'O(V + E)'
    }
  };
}
