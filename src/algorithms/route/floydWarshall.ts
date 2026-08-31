import { Graph } from '../../dataStructures/Graph';
import { AlgorithmMetrics } from '../../types';

export interface FloydWarshallResult {
  distances: number[][];
  nextMatrix: (string | null)[][];
  nodeList: string[];
  metrics: AlgorithmMetrics;
  getPath: (fromId: string, toId: string) => { path: string[]; distance: number };
}

/**
 * Floyd-Warshall All-Pairs Shortest Path Algorithm
 * Time Complexity: O(V^3)
 * Space Complexity: O(V^2) for distance and successor matrices
 */
export function runFloydWarshall(graph: Graph): FloydWarshallResult {
  const startTime = performance.now();

  const { matrix, idMap, reverseMap } = graph.getAdjacencyMatrix();
  const n = reverseMap.length;

  const dist: number[][] = matrix.map(row => [...row]);
  const next: (string | null)[][] = Array.from({ length: n }, () => Array(n).fill(null));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j && dist[i][j] < Infinity) {
        next[i][j] = reverseMap[j];
      }
    }
  }

  // Triple nested dynamic programming relaxation loop
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
          next[i][j] = next[i][k];
        }
      }
    }
  }

  const endTime = performance.now();
  const executionTimeMs = endTime - startTime;

  const getPath = (fromId: string, toId: string): { path: string[]; distance: number } => {
    const u = idMap.get(fromId);
    const v = idMap.get(toId);
    if (u === undefined || v === undefined || dist[u][v] === Infinity) {
      return { path: [], distance: Infinity };
    }

    const path: string[] = [fromId];
    let curr = u;
    while (curr !== v) {
      const nextNodeName = next[curr][v];
      if (!nextNodeName) return { path: [], distance: Infinity };
      path.push(nextNodeName);
      curr = idMap.get(nextNodeName)!;
    }

    return { path, distance: Math.round(dist[u][v] * 100) / 100 };
  };

  return {
    distances: dist,
    nextMatrix: next,
    nodeList: reverseMap,
    metrics: {
      algorithmName: 'Floyd-Warshall (All-Pairs Dynamic Programming)',
      executionTimeMs: Math.round(executionTimeMs * 1000) / 1000,
      executionTimeUs: Math.round(executionTimeMs * 1000),
      nodesVisited: n * n * n,
      memoryEstimateKb: Math.round((n * n * 0.08) * 100) / 100,
      timeComplexity: 'O(V^3)',
      spaceComplexity: 'O(V^2)'
    },
    getPath
  };
}
