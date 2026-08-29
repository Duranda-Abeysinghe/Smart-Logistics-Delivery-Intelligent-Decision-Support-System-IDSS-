import { LogisticsNode, TourResult } from '../../types';
import { calculateDistanceMatrix, computeTourTotalDistance } from './tspDP';

export function runGreedyTSP(nodes: LogisticsNode[]): TourResult {
  const startTime = performance.now();
  const n = nodes.length;
  const distMatrix = calculateDistanceMatrix(nodes);

  const visited = new Set<number>();
  const tourIndices: number[] = [0];
  visited.add(0);

  let current = 0;
  while (visited.size < n) {
    let nearest = -1;
    let minDist = Infinity;

    for (let next = 0; next < n; next++) {
      if (!visited.has(next) && distMatrix[current][next] < minDist) {
        minDist = distMatrix[current][next];
        nearest = next;
      }
    }

    if (nearest !== -1) {
      visited.add(nearest);
      tourIndices.push(nearest);
      current = nearest;
    }
  }

  tourIndices.push(0); // Return to start

  const endTime = performance.now();
  const executionTimeMs = endTime - startTime;

  const totalDistance = computeTourTotalDistance(tourIndices.slice(0, -1), distMatrix);
  const totalCost = Math.round(totalDistance * 1.85 * 100) / 100;

  return {
    route: tourIndices.map(i => nodes[i].id),
    totalDistance,
    totalCost,
    computationTimeMs: Math.round(executionTimeMs * 1000) / 1000,
    algorithm: 'Greedy Nearest Neighbor Heuristic',
    timeComplexity: 'O(n^2)',
    spaceComplexity: 'O(n)'
  };
}
