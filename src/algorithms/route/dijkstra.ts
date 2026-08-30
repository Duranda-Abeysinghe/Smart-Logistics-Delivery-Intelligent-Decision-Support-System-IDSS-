import { Graph } from '../../dataStructures/Graph';
import { PriorityQueue } from '../../dataStructures/PriorityQueue';
import { AlgorithmMetrics, RouteStep } from '../../types';

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

  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const edgeUsed = new Map<string, { distance: number; cost: number; travelTime: number }>();
  const pq = new PriorityQueue<string>();
  const visitedSequence: string[] = [];
  const visitedSet = new Set<string>();

  for (const nodeId of graph.getAllNodeIds()) {
    distances.set(nodeId, Infinity);
    previous.set(nodeId, null);
  }

  distances.set(startNodeId, 0);
  pq.push(startNodeId, 0);

  while (!pq.isEmpty()) {
    const current = pq.pop();
    if (!current) break;

    if (visitedSet.has(current)) continue;
    visitedSet.add(current);
    visitedSequence.push(current);

    if (current === targetNodeId) break;

    const currentDist = distances.get(current)!;
    const neighbors = graph.getNeighbors(current);

    for (const edge of neighbors) {
      if (edge.isBlocked) continue;

      let weight = edge.distance;
      if (optimizeCriterion === 'time') {
        weight = edge.travelTime * (edge.trafficMultiplier || 1);
      } else if (optimizeCriterion === 'cost') {
        weight = edge.cost * (edge.trafficMultiplier || 1);
      }

      const newDist = currentDist + weight;
      if (newDist < (distances.get(edge.target) ?? Infinity)) {
        distances.set(edge.target, newDist);
        previous.set(edge.target, current);
        edgeUsed.set(edge.target, {
          distance: edge.distance,
          cost: edge.cost,
          travelTime: edge.travelTime
        });
        pq.push(edge.target, newDist);
      }
    }
  }

  const endTime = performance.now();
  const executionTimeMs = endTime - startTime;

  // Reconstruct path
  const path: string[] = [];
  let curr: string | null = targetNodeId;
  while (curr !== null) {
    path.unshift(curr);
    curr = previous.get(curr) || null;
  }

  // Handle disconnected
  const isFound = path.length > 0 && path[0] === startNodeId;
  const finalPath = isFound ? path : [];

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
      memoryEstimateKb: Math.round((graph.getAllNodeIds().length * 0.12) * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalDistance: Math.round(totalDistance * 100) / 100,
      path: finalPath,
      solutionQualityScore: isFound ? 100 : 0,
      timeComplexity: 'O((V + E) log V)',
      spaceComplexity: 'O(V)'
    }
  };
}
