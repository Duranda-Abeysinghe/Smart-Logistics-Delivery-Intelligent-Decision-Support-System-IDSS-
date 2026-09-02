import { Graph } from '../../dataStructures/Graph';
import { RouteResult } from './dijkstra';
import { RouteStep } from '../../types';

/**
 * Bellman-Ford Shortest Path Algorithm
 * Time Complexity: O(V * E)
 * Space Complexity: O(V)
 * Feature: Capable of detecting negative cycles and solving graphs with negative edge weights
 */
export function runBellmanFord(
  graph: Graph,
  startNodeId: string,
  targetNodeId: string,
  optimizeCriterion: 'distance' | 'time' | 'cost' = 'distance'
): RouteResult & { hasNegativeCycle: boolean } {
  const startTime = performance.now(); // Record start time for performance measurement

  const nodes = graph.getAllNodeIds(); // All node IDs in the graph
  const edges = graph.getAllEdges(); // All edges in the graph
  const distances = new Map<string, number>(); // Shortest known distance from start to each node
  const previous = new Map<string, string | null>(); // Predecessor map for path reconstruction

  // Initialize all nodes with infinite distance and no predecessor
  for (const nodeId of nodes) {
    distances.set(nodeId, Infinity);
    previous.set(nodeId, null);
  }

  distances.set(startNodeId, 0); // Distance from start to itself is 0

  // Relax edges |V| - 1 times
  const vCount = nodes.length;
  for (let i = 1; i <= vCount - 1; i++) {
    let anyRelaxed = false; // Tracks whether any edge was relaxed in this pass
    for (const edge of edges) {
      if (edge.isBlocked) continue; // Skip blocked/unusable edges

      // Choose edge weight based on the requested optimization criterion
      let weight = edge.distance;
      if (optimizeCriterion === 'time') {
        weight = edge.travelTime * (edge.trafficMultiplier || 1);
      } else if (optimizeCriterion === 'cost') {
        weight = edge.cost * (edge.trafficMultiplier || 1);
      }

      const uDist = distances.get(edge.source)!;
      if (uDist !== Infinity) {
        const vDist = distances.get(edge.target)!;
        if (uDist + weight < vDist) {
          // Found a shorter path to the target via this edge
          distances.set(edge.target, uDist + weight);
          previous.set(edge.target, edge.source);
          anyRelaxed = true;
        }
      }
    }
    if (!anyRelaxed) break; // Early termination optimization: no changes means we've converged
  }

  // Check for negative-weight cycles: if any edge can still be relaxed after |V|-1 passes,
  // a negative cycle must exist
  let hasNegativeCycle = false;
  for (const edge of edges) {
    if (edge.isBlocked) continue;
    let weight = edge.distance;
    if (optimizeCriterion === 'time') weight = edge.travelTime;
    if (optimizeCriterion === 'cost') weight = edge.cost;

    const uDist = distances.get(edge.source)!;
    if (uDist !== Infinity && uDist + weight < distances.get(edge.target)!) {
      hasNegativeCycle = true;
      break;
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
    visitedNodesCount: nodes.length, // Bellman-Ford considers all nodes each pass, so this is the full node count
    visitedSequence: nodes,
    hasNegativeCycle, // Whether a negative-weight cycle was detected in the graph
    metrics: {
      algorithmName: 'Bellman-Ford (Edge Relaxation)',
      executionTimeMs: Math.round(executionTimeMs * 1000) / 1000, // Execution time in ms, rounded to 3 decimals
      executionTimeUs: Math.round(executionTimeMs * 1000), // Execution time converted to microseconds
      nodesVisited: nodes.length,
      memoryEstimateKb: Math.round((nodes.length * 0.18) * 100) / 100, // Rough memory usage estimate
      totalCost: Math.round(totalCost * 100) / 100,
      totalDistance: Math.round(totalDistance * 100) / 100,
      path: finalPath,
      solutionQualityScore: isFound ? 100 : 0, // Simple binary quality score: found a path or not
      timeComplexity: 'O(V * E)',
      spaceComplexity: 'O(V)'
    }
  };
}
