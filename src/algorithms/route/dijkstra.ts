import { Graph } from '../../dataStructures/Graph';
import { PriorityQueue } from '../../dataStructures/PriorityQueue';
import { AlgorithmMetrics, RouteStep } from '../../types';

export interface RouteResult {
  path: string[]; // Ordered list of node IDs forming the final route
  totalDistance: number; // Sum of edge distances along the path
  totalTime: number; // Sum of travel times along the path
  totalCost: number; // Sum of edge costs along the path
  steps: RouteStep[]; // Step-by-step breakdown of the route
  visitedNodesCount: number; // Number of nodes visited during the search
  visitedSequence: string[]; // Order in which nodes were visited
  metrics: AlgorithmMetrics; // Performance and complexity metrics for this run
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
  const startTime = performance.now(); // Record start time for performance measurement

  const distances = new Map<string, number>(); // Shortest known distance from start to each node
  const previous = new Map<string, string | null>(); // Predecessor map for path reconstruction
  const edgeUsed = new Map<string, { distance: number; cost: number; travelTime: number }>(); // Tracks which edge was used to reach each node
  const pq = new PriorityQueue<string>(); // Frontier of nodes to explore, ordered by distance
  const visitedSequence: string[] = []; // Order in which nodes were finalized/visited
  const visitedSet = new Set<string>(); // Nodes that have been fully processed

  // Initialize all nodes with infinite distance and no predecessor
  for (const nodeId of graph.getAllNodeIds()) {
    distances.set(nodeId, Infinity);
    previous.set(nodeId, null);
  }

  // Seed the search from the start node
  distances.set(startNodeId, 0);
  pq.push(startNodeId, 0);

  // Main loop: repeatedly extract the closest unvisited node and relax its edges
  while (!pq.isEmpty()) {
    const current = pq.pop();
    if (!current) break;

    if (visitedSet.has(current)) continue; // Skip stale/duplicate queue entries
    visitedSet.add(current);
    visitedSequence.push(current);

    if (current === targetNodeId) break; // Early exit once target is reached

    const currentDist = distances.get(current)!;
    const neighbors = graph.getNeighbors(current);

    // Relax all outgoing edges from the current node
    for (const edge of neighbors) {
      if (edge.isBlocked) continue; // Skip blocked/unusable edges

      // Choose edge weight based on the requested optimization criterion
      let weight = edge.distance;
      if (optimizeCriterion === 'time') {
        weight = edge.travelTime * (edge.trafficMultiplier || 1);
      } else if (optimizeCriterion === 'cost') {
        weight = edge.cost * (edge.trafficMultiplier || 1);
      }

      const newDist = currentDist + weight; // Candidate distance to neighbor via current node
      if (newDist < (distances.get(edge.target) ?? Infinity)) {
        // Found a shorter path to this neighbor, so update distance, predecessor, and edge info
        distances.set(edge.target, newDist);
        previous.set(edge.target, current);
        edgeUsed.set(edge.target, {
          distance: edge.distance,
          cost: edge.cost,
          travelTime: edge.travelTime
        });
        pq.push(edge.target, newDist); // Push updated neighbor back into the frontier
      }
    }
  }

  const endTime = performance.now(); // Record end time for performance measurement
  const executionTimeMs = endTime - startTime; // Total execution time in milliseconds

  // Reconstruct path by walking backwards from target to start using the predecessor map
  const path: string[] = [];
  let curr: string | null = targetNodeId;
  while (curr !== null) {
    path.unshift(curr);
    curr = previous.get(curr) || null;
  }

  // Handle disconnected: a valid path must actually start at the start node
  const isFound = path.length > 0 && path[0] === startNodeId;
  const finalPath = isFound ? path : [];

  let totalDistance = 0;
  let totalTime = 0;
  let totalCost = 0;
  const steps: RouteStep[] = []; // Step-by-step breakdown of the final route
  let runningDistance = 0;

  // Build the detailed step list and totals by walking along the reconstructed path
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
    totalDistance: Math.round(totalDistance * 100) / 100, // Rounded total distance for the route
    totalTime: Math.round(totalTime * 10) / 10, // Rounded total travel time for the route
    totalCost: Math.round(totalCost * 100) / 100, // Rounded total cost for the route
    steps,
    visitedNodesCount: visitedSet.size,
    visitedSequence,
    metrics: {
      algorithmName: 'Dijkstra (Min-Heap PQ)',
      executionTimeMs: Math.round(executionTimeMs * 1000) / 1000, // Execution time in ms, rounded to 3 decimals
      executionTimeUs: Math.round(executionTimeMs * 1000), // Execution time converted to microseconds
      nodesVisited: visitedSet.size,
      memoryEstimateKb: Math.round((graph.getAllNodeIds().length * 0.12) * 100) / 100, // Rough memory usage estimate
      totalCost: Math.round(totalCost * 100) / 100,
      totalDistance: Math.round(totalDistance * 100) / 100,
      path: finalPath,
      solutionQualityScore: isFound ? 100 : 0, // Simple binary quality score: found a path or not
      timeComplexity: 'O((V + E) log V)',
      spaceComplexity: 'O(V)'
    }
  };
}
