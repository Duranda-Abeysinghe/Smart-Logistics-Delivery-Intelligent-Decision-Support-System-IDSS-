import { LogisticsNode, TourResult, OptimizationIteration } from '../../types';

export function calculateDistanceMatrix(nodes: LogisticsNode[]): number[][] {
  const n = nodes.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        // Euclidean distance converted to realistic logistics kilometers
        const distKm = Math.sqrt(dx * dx + dy * dy) * 0.08;
        matrix[i][j] = Math.round(distKm * 10) / 10;
      }
    }
  }
  return matrix;
}

export function computeTourTotalDistance(tourIndices: number[], distMatrix: number[][]): number {
  let total = 0;
  for (let i = 0; i < tourIndices.length - 1; i++) {
    total += distMatrix[tourIndices[i]][tourIndices[i + 1]];
  }
  if (tourIndices.length > 1) {
    total += distMatrix[tourIndices[tourIndices.length - 1]][tourIndices[0]];
  }
  return Math.round(total * 100) / 100;
}

/**
 * Held-Karp Exact Dynamic Programming for TSP Scheduling
 * Time Complexity: O(n^2 * 2^n)
 * Space Complexity: O(n * 2^n)
 */
export function runExactDP_TSP(nodes: LogisticsNode[]): TourResult {
  const startTime = performance.now();
  const n = Math.min(nodes.length, 14); // Limit to 14 nodes for DP memory sanity
  const subsetNodes = nodes.slice(0, n);
  const distMatrix = calculateDistanceMatrix(subsetNodes);

  const numStates = 1 << n;
  const memo: number[][] = Array.from({ length: numStates }, () => Array(n).fill(-1));
  const parent: number[][] = Array.from({ length: numStates }, () => Array(n).fill(-1));

  function solveDP(mask: number, pos: number): number {
    if (mask === (1 << n) - 1) {
      return distMatrix[pos][0]; // Return to start
    }

    if (memo[mask][pos] !== -1) {
      return memo[mask][pos];
    }

    let minCost = Infinity;
    let bestNext = -1;

    for (let next = 0; next < n; next++) {
      if ((mask & (1 << next)) === 0) {
        const cost = distMatrix[pos][next] + solveDP(mask | (1 << next), next);
        if (cost < minCost) {
          minCost = cost;
          bestNext = next;
        }
      }
    }

    parent[mask][pos] = bestNext;
    memo[mask][pos] = minCost;
    return minCost;
  }

  const optimalDistance = solveDP(1, 0);

  // Reconstruct path
  const tourIndices: number[] = [0];
  let currMask = 1;
  let currPos = 0;

  for (let step = 0; step < n - 1; step++) {
    const nextPos = parent[currMask][currPos];
    if (nextPos === -1) break;
    tourIndices.push(nextPos);
    currMask |= (1 << nextPos);
    currPos = nextPos;
  }
  tourIndices.push(0); // Return to depot

  const endTime = performance.now();
  const executionTimeMs = endTime - startTime;

  const routeIds = tourIndices.map(idx => subsetNodes[idx].id);
  const totalCost = Math.round(optimalDistance * 1.85 * 100) / 100;

  return {
    route: routeIds,
    totalDistance: Math.round(optimalDistance * 100) / 100,
    totalCost,
    computationTimeMs: Math.round(executionTimeMs * 1000) / 1000,
    algorithm: 'Exact Held-Karp Dynamic Programming',
    timeComplexity: 'O(n^2 * 2^n)',
    spaceComplexity: 'O(n * 2^n)'
  };
}

/**
 * Greedy Nearest Neighbor TSP Approximation
 * Time Complexity: O(n^2)
 * Space Complexity: O(n)
 */

