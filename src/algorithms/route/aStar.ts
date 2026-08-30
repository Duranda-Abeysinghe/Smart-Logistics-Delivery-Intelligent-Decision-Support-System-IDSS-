import { Graph } from '../../dataStructures/Graph';
import { PriorityQueue } from '../../dataStructures/PriorityQueue';
import { RouteResult } from './dijkstra';
import { RouteStep } from '../../types';

/**
 * Admissible Euclidean Heuristic function for A* Search
 * Scales pixel distance to realistic network km
 */
function euclideanHeuristic(
  graph: Graph,
  nodeIdA: string,
  nodeIdB: string,
  scale: number = 0.05
): number {
  const nodeA = graph.getNode(nodeIdA);
  const nodeB = graph.getNode(nodeIdB);
  if (!nodeA || !nodeB) return 0;
  const dx = nodeA.x - nodeB.x;
  const dy = nodeA.y - nodeB.y;
  return Math.sqrt(dx * dx + dy * dy) * scale;
}

/**
 * A* Shortest Path Search Algorithm
 * Time Complexity: O(E) in best case with perfect heuristic, O(b^d) / O((V+E) log V) in worst case
 * Space Complexity: O(V)
 */
export function runAStar(
  graph: Graph,
  startNodeId: string,
  targetNodeId: string,
  optimizeCriterion: 'distance' | 'time' | 'cost' = 'distance'
): RouteResult {
  const startTime = performance.now();

  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const pq = new PriorityQueue<string>();
  const visitedSet = new Set<string>();
  const visitedSequence: string[] = [];

  for (const nodeId of graph.getAllNodeIds()) {
    gScore.set(nodeId, Infinity);
    fScore.set(nodeId, Infinity);
    previous.set(nodeId, null);
  }

  gScore.set(startNodeId, 0);
  const initialH = euclideanHeuristic(graph, startNodeId, targetNodeId);
  fScore.set(startNodeId, initialH);
  pq.push(startNodeId, initialH);

  while (!pq.isEmpty()) {
    const current = pq.pop();
    if (!current) break;

    if (visitedSet.has(current)) continue;
    visitedSet.add(current);
    visitedSequence.push(current);

    if (current === targetNodeId) break;

    const currentG = gScore.get(current)!;
    const neighbors = graph.getNeighbors(current);

    for (const edge of neighbors) {
      if (edge.isBlocked) continue;

      let weight = edge.distance;
      if (optimizeCriterion === 'time') {
        weight = edge.travelTime * (edge.trafficMultiplier || 1);
      } else if (optimizeCriterion === 'cost') {
        weight = edge.cost * (edge.trafficMultiplier || 1);
      }

      const tentativeG = currentG + weight;
      if (tentativeG < (gScore.get(edge.target) ?? Infinity)) {
        previous.set(edge.target, current);
        gScore.set(edge.target, tentativeG);
        const h = euclideanHeuristic(graph, edge.target, targetNodeId);
        const f = tentativeG + h;
        fScore.set(edge.target, f);
        pq.push(edge.target, f);
      }
    }
  }

  const endTime = performance.now();
  const executionTimeMs = endTime - startTime;

  // Path reconstruction
  const path: string[] = [];
  let curr: string | null = targetNodeId;
  while (curr !== null) {
    path.unshift(curr);
    curr = previous.get(curr) || null;
  }

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
      algorithmName: 'A* Search (Euclidean Heuristic)',
      executionTimeMs: Math.round(executionTimeMs * 1000) / 1000,
      executionTimeUs: Math.round(executionTimeMs * 1000),
      nodesVisited: visitedSet.size,
      memoryEstimateKb: Math.round((graph.getAllNodeIds().length * 0.15) * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalDistance: Math.round(totalDistance * 100) / 100,
      path: finalPath,
      solutionQualityScore: isFound ? 100 : 0,
      timeComplexity: 'O(E) best, O((V + E) log V) worst',
      spaceComplexity: 'O(V)'
    }
  };
}
