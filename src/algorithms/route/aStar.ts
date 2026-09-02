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
  const nodeA = graph.getNode(nodeIdA); // Look up node A's coordinates
  const nodeB = graph.getNode(nodeIdB); // Look up node B's coordinates
  if (!nodeA || !nodeB) return 0; // If either node is missing, treat heuristic as 0 (no guidance)
  const dx = nodeA.x - nodeB.x; // Horizontal distance between the two nodes
  const dy = nodeA.y - nodeB.y; // Vertical distance between the two nodes
  return Math.sqrt(dx * dx + dy * dy) * scale; // Euclidean distance scaled to approximate real-world units
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
  const startTime = performance.now(); // Record start time for performance measurement

  const gScore = new Map<string, number>(); // Cost of the cheapest known path from start to each node
  const fScore = new Map<string, number>(); // gScore + heuristic estimate to target, used for priority ordering
  const previous = new Map<string, string | null>(); // Tracks the predecessor of each node for path reconstruction
  const pq = new PriorityQueue<string>(); // Frontier of nodes to explore, ordered by fScore
  const visitedSet = new Set<string>(); // Nodes that have been fully processed
  const visitedSequence: string[] = []; // Order in which nodes were visited (useful for visualization/debugging)

  // Initialize all nodes with infinite scores and no predecessor
  for (const nodeId of graph.getAllNodeIds()) {
    gScore.set(nodeId, Infinity);
    fScore.set(nodeId, Infinity);
    previous.set(nodeId, null);
  }

  // Seed the search from the start node
  gScore.set(startNodeId, 0);
  const initialH = euclideanHeuristic(graph, startNodeId, targetNodeId);
  fScore.set(startNodeId, initialH);
  pq.push(startNodeId, initialH);

  // Main search loop: repeatedly expand the most promising node until the queue is empty
  while (!pq.isEmpty()) {
    const current = pq.pop();
    if (!current) break;

    if (visitedSet.has(current)) continue; // Skip stale/duplicate queue entries
    visitedSet.add(current);
    visitedSequence.push(current);

    if (current === targetNodeId) break; // Early exit once we reach the target

    const currentG = gScore.get(current)!;
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

      const tentativeG = currentG + weight; // Candidate path cost to the neighbor via current node
      if (tentativeG < (gScore.get(edge.target) ?? Infinity)) {
        // Found a better path to this neighbor, so update its scores and predecessor
        previous.set(edge.target, current);
        gScore.set(edge.target, tentativeG);
        const h = euclideanHeuristic(graph, edge.target, targetNodeId);
        const f = tentativeG + h;
        fScore.set(edge.target, f);
        pq.push(edge.target, f); // Push updated neighbor back into the frontier
      }
    }
  }

  const endTime = performance.now(); // Record end time for performance measurement
  const executionTimeMs = endTime - startTime; // Total execution time in milliseconds

  // Path reconstruction: walk backwards from target to start using the predecessor map
  const path: string[] = [];
  let curr: string | null = targetNodeId;
  while (curr !== null) {
    path.unshift(curr);
    curr = previous.get(curr) || null;
  }

  // A valid path must actually start at the start node (otherwise target was unreachable)
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
      algorithmName: 'A* Search (Euclidean Heuristic)',
      executionTimeMs: Math.round(executionTimeMs * 1000) / 1000, // Execution time in ms, rounded to 3 decimals
      executionTimeUs: Math.round(executionTimeMs * 1000), // Execution time converted to microseconds
      nodesVisited: visitedSet.size,
      memoryEstimateKb: Math.round((graph.getAllNodeIds().length * 0.15) * 100) / 100, // Rough memory usage estimate
      totalCost: Math.round(totalCost * 100) / 100,
      totalDistance: Math.round(totalDistance * 100) / 100,
      path: finalPath,
      solutionQualityScore: isFound ? 100 : 0, // Simple binary quality score: found a path or not
      timeComplexity: 'O(E) best, O((V + E) log V) worst',
      spaceComplexity: 'O(V)'
    }
  };
}
