import { Graph } from '../../dataStructures/Graph';
import { AlgorithmMetrics } from '../../types';

export interface FloydWarshallResult {
  distances: number[][]; // Final shortest-distance matrix between all pairs of nodes
  nextMatrix: (string | null)[][]; // Successor matrix used to reconstruct shortest paths
  nodeList: string[]; // List of node IDs, indexed the same way as the matrices
  metrics: AlgorithmMetrics; // Performance and complexity metrics for this run
  getPath: (fromId: string, toId: string) => { path: string[]; distance: number }; // Helper to reconstruct the shortest path between two nodes
}

/**
 * Floyd-Warshall All-Pairs Shortest Path Algorithm
 * Time Complexity: O(V^3)
 * Space Complexity: O(V^2) for distance and successor matrices
 */
export function runFloydWarshall(graph: Graph): FloydWarshallResult {
  const startTime = performance.now(); // Record start time for performance measurement

  // Get adjacency matrix representation of the graph, plus mappings between node IDs and matrix indices
  const { matrix, idMap, reverseMap } = graph.getAdjacencyMatrix();
  const n = reverseMap.length; // Number of nodes in the graph

  // Clone the adjacency matrix so we don't mutate the original graph data
  const dist: number[][] = matrix.map(row => [...row]);

  // Initialize the successor matrix (used later to reconstruct paths), starting with all nulls
  const next: (string | null)[][] = Array.from({ length: n }, () => Array(n).fill(null));

  // Seed the successor matrix: for every direct edge (i -> j) with finite distance,
  // the next hop from i to j is simply j itself
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j && dist[i][j] < Infinity) {
        next[i][j] = reverseMap[j];
      }
    }
  }

  // Triple nested dynamic programming relaxation loop
  // For each intermediate node k, check if routing i -> k -> j is shorter than the current i -> j distance
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          // Found a shorter path through k, so update distance and successor matrices
          dist[i][j] = dist[i][k] + dist[k][j];
          next[i][j] = next[i][k];
        }
      }
    }
  }

  const endTime = performance.now(); // Record end time for performance measurement
  const executionTimeMs = endTime - startTime; // Total execution time in milliseconds

  // Reconstructs the actual path (sequence of node IDs) and total distance between two nodes
  // using the successor matrix computed above
  const getPath = (fromId: string, toId: string): { path: string[]; distance: number } => {
    const u = idMap.get(fromId); // Matrix index for the starting node
    const v = idMap.get(toId); // Matrix index for the destination node

    // If either node doesn't exist, or there's no path between them, return an empty result
    if (u === undefined || v === undefined || dist[u][v] === Infinity) {
      return { path: [], distance: Infinity };
    }

    const path: string[] = [fromId]; // Start building the path from the source node
    let curr = u;

    // Walk the successor matrix from u to v, appending each hop until we reach the destination
    while (curr !== v) {
      const nextNodeName = next[curr][v];
      if (!nextNodeName) return { path: [], distance: Infinity }; // Safety check: path broken/unreachable
      path.push(nextNodeName);
      curr = idMap.get(nextNodeName)!;
    }

    // Round the distance to 2 decimal places for cleaner output
    return { path, distance: Math.round(dist[u][v] * 100) / 100 };
  };

  return {
    distances: dist, // All-pairs shortest distance matrix
    nextMatrix: next, // Successor matrix for path reconstruction
    nodeList: reverseMap, // Node IDs in matrix index order
    metrics: {
      algorithmName: 'Floyd-Warshall (All-Pairs Dynamic Programming)',
      executionTimeMs: Math.round(executionTimeMs * 1000) / 1000, // Execution time in ms, rounded to 3 decimals
      executionTimeUs: Math.round(executionTimeMs * 1000), // Execution time converted to microseconds
      nodesVisited: n * n * n, // Total iterations performed (V^3, reflecting the triple loop)
      memoryEstimateKb: Math.round((n * n * 0.08) * 100) / 100, // Rough memory usage estimate based on matrix size
      timeComplexity: 'O(V^3)',
      spaceComplexity: 'O(V^2)'
    },
    getPath
  };
}
