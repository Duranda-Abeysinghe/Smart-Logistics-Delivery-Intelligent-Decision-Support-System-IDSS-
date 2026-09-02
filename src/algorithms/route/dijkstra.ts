import { Graph } from '../../dataStructures/Graph';
import { PriorityQueue } from '../../dataStructures/PriorityQueue';
import { AlgorithmMetrics, RouteStep } from '../../types';

// Shape of the result returned by any route-finding algorithm in this module
// (Dijkstra, A*, etc. all conform to this so the UI can render them interchangeably)
export interface RouteResult {
  path: string[];
  totalDistance: number;
  totalTime: number;
  totalCost: number;
  steps: RouteStep[];
  visitedNodesCount: number;
  visitedSequence: string[];
  metrics: AlgorithmMetrics;
}

/**
 * Dijkstra's Algorithm
 * Time Complexity: O((V + E) log V) with Binary Min-Heap Priority Queue
 * Space Complexity: O(V) for distance table and priority queue
 */
export function runDijkstra(
  graph: Graph,
  startNodeId: string,
  targetNodeId: string,
  optimizeCriterion: 'distance' | 'time' | 'cost' = 'distance'
): RouteResult {
  const startTime = performance.now();

  // distances: shortest known cost from startNode to each node so far
  const distances = new Map<string, number>();
  // previous: predecessor of each node on its current shortest-known path (for reconstruction)
  const previous = new Map<string, string | null>();
  // edgeUsed: the specific edge that produced the shortest-known path to each node
  // (currently tracked but not read elsewhere - kept for potential debugging/analysis use)
  const edgeUsed = new Map<string, { distance: number; cost: number; travelTime: number }>();
  // Min-priority queue ordered by current known distance - always expands the closest unvisited node
  const pq = new PriorityQueue<string>();
  // Order in which nodes were finalized, useful for visualizing algorithm progress
  const visitedSequence: string[] = [];
  // Nodes that have been finalized/expanded (won't be revisited)
  const visitedSet = new Set<string>();

  // Initialize all nodes with infinite distance and no known predecessor
  for (const nodeId of graph.getAllNodeIds()) {
    distances.set(nodeId, Infinity);
    previous.set(nodeId, null);
  }

  // Start node has zero distance to itself
  distances.set(startNodeId, 0);
  pq.push(startNodeId, 0);


  const endTime = performance.now();
  const executionTimeMs = endTime - startTime;

  // Reconstruct path by walking backwards from target to start using the `previous` map
  const path: string[] = [];
  let curr: string | null = targetNodeId;
  while (curr !== null) {
    path.unshift(curr);
    curr = previous.get(curr) || null;
  }

  // Handle disconnected
  // A valid path must actually begin at the start node
  // (otherwise target was unreachable and reconstruction stopped early)
  const isFound = path.length > 0 && path[0] === startNodeId;
  const finalPath = isFound ? path : [];

  // Accumulate totals and per-step breakdown for the final path
  let totalDistance = 0;
  let totalTime = 0;
  let totalCost = 0;
  const steps: RouteStep[] = [];
  let runningDistance = 0;

  if (isFound) {
    for (let i = 0; i < finalPath.length - 1; i++) {
      const u = finalPath[i];
      const v = finalPath[i + 1];
      const edge = graph.getEdge(u, v);
      if (edge) {
        totalDistance += edge.distance;
        totalTime += edge.travelTime * (edge.trafficMultiplier || 1);
        totalCost += edge.cost;
        runningDistance += edge.distance;
        steps.push({
          fromNode: u,
          toNode: v,
          distance: edge.distance,
          cost: edge.cost,
          cumulativeDistance: runningDistance
        });
      }
    }
  }

  // Assemble the final result, including diagnostic metrics for the evaluation module
  return {
    path: finalPath,
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalTime: Math.round(totalTime * 10) / 10,
    totalCost: Math.round(totalCost * 100) / 100,
    steps,
    visitedNodesCount: visitedSet.size,
    visitedSequence,
    metrics: {
      algorithmName: 'Dijkstra (Min-Heap PQ)',
      executionTimeMs: Math.round(executionTimeMs * 1000) / 1000,
      executionTimeUs: Math.round(executionTimeMs * 1000),
      nodesVisited: visitedSet.size,
      // Rough memory estimate based on number of nodes touched (for algorithm comparison charts)
      memoryEstimateKb: Math.round((graph.getAllNodeIds().length * 0.12) * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalDistance: Math.round(totalDistance * 100) / 100,
      path: finalPath,
      // Simple binary quality score: 100 if a path was found, 0 if target was unreachable
      solutionQualityScore: isFound ? 100 : 0,
      timeComplexity: 'O((V + E) log V)',
      spaceComplexity: 'O(V)'
    }
  };
}
