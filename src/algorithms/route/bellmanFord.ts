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
  const startTime = performance.now();

  const nodes = graph.getAllNodeIds();
  const edges = graph.getAllEdges();
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();

  for (const nodeId of nodes) {
    distances.set(nodeId, Infinity);
    previous.set(nodeId, null);
  }

  distances.set(startNodeId, 0);

  // Relax edges |V| - 1 times
  const vCount = nodes.length;
  for (let i = 1; i <= vCount - 1; i++) {
    let anyRelaxed = false;
    for (const edge of edges) {
      if (edge.isBlocked) continue;

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
          distances.set(edge.target, uDist + weight);
          previous.set(edge.target, edge.source);
          anyRelaxed = true;
        }
      }
    }
    if (!anyRelaxed) break; // Early termination optimization
  }

  // Check for negative-weight cycles
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
    visitedNodesCount: nodes.length,
    visitedSequence: nodes,
    hasNegativeCycle,
    metrics: {
      algorithmName: 'Bellman-Ford (Edge Relaxation)',
      executionTimeMs: Math.round(executionTimeMs * 1000) / 1000,
      executionTimeUs: Math.round(executionTimeMs * 1000),
      nodesVisited: nodes.length,
      memoryEstimateKb: Math.round((nodes.length * 0.18) * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalDistance: Math.round(totalDistance * 100) / 100,
      path: finalPath,
      solutionQualityScore: isFound ? 100 : 0,
      timeComplexity: 'O(V * E)',
      spaceComplexity: 'O(V)'
    }
  };
}
