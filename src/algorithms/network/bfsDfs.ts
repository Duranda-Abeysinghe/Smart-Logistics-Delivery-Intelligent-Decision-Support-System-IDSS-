import { Graph } from '../../dataStructures/Graph';
import { AlgorithmMetrics } from '../../types';

export interface ConnectivityResult {
  connectedComponents: string[][];
  componentCount: number;
  bridges: { source: string; target: string }[];
  isFullyConnected: boolean;
  graphDiameter: number;
  graphDensity: number;
  traversalOrder: string[];
  metrics: AlgorithmMetrics;
}

/**
 * BFS and DFS Connectivity and Bridge Analysis
 * Time Complexity: O(V + E)
 * Space Complexity: O(V)
 */
export function runNetworkTraversal(graph: Graph, startNodeId?: string): ConnectivityResult {
  const startTime = performance.now();

  const allNodes = graph.getAllNodeIds();
  const n = allNodes.length;
  const visited = new Set<string>();
  const allComponents: string[][] = [];
  const bfsTraversalOrder: string[] = [];

  // Find all connected components using BFS
  for (const node of allNodes) {
    if (!visited.has(node)) {
      const component: string[] = [];
      const queue: string[] = [node];
      visited.add(node);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        component.push(curr);
        bfsTraversalOrder.push(curr);

        for (const edge of graph.getNeighbors(curr)) {
          if (!edge.isBlocked && !visited.has(edge.target)) {
            visited.add(edge.target);
            queue.push(edge.target);
          }
        }
      }
      allComponents.push(component);
    }
  }

  // Tarjan's Bridge-finding Algorithm using DFS
  const bridges: { source: string; target: string }[] = [];
  const disc = new Map<string, number>();
  const low = new Map<string, number>();
  const parent = new Map<string, string | null>();
  let timer = 0;

  function bridgeDFS(u: string) {
    timer++;
    disc.set(u, timer);
    low.set(u, timer);

    for (const edge of graph.getNeighbors(u)) {
      const v = edge.target;
      if (edge.isBlocked) continue;

      if (!disc.has(v)) {
        parent.set(v, u);
        bridgeDFS(v);
        low.set(u, Math.min(low.get(u)!, low.get(v)!));

        if (low.get(v)! > disc.get(u)!) {
          bridges.push({ source: u, target: v });
        }
      } else if (v !== parent.get(u)) {
        low.set(u, Math.min(low.get(u)!, disc.get(v)!));
      }
    }
  }

  for (const node of allNodes) {
    if (!disc.has(node)) {
      bridgeDFS(node);
    }
}

  }
