import { LogisticsNode, TourResult, OptimizationIteration } from '../../types';
import { calculateDistanceMatrix, computeTourTotalDistance } from './tspDP';

/**
 * Simulated Annealing Metaheuristic for Vehicle Routing Tour Optimization
 * Employs 2-opt edge swap neighborhood operator and Metropolis acceptance criterion: P = exp(-dE / T)
 * Time Complexity: O(MaxIterations * N)
 * Space Complexity: O(N)
 */
export function runSimulatedAnnealing(
  nodes: LogisticsNode[],
  initialTemp: number = 1000,
  coolingRate: number = 0.985,
  maxIterations: number = 500
): TourResult {
  const startTime = performance.now();
  const n = nodes.length;
  const distMatrix = calculateDistanceMatrix(nodes);

  // Initial solution: [0, 1, 2, ..., n-1]
  let currentTour: number[] = Array.from({ length: n }, (_, i) => i);
  let currentDist = computeTourTotalDistance(currentTour, distMatrix);

  let bestTour = [...currentTour];
  let bestDist = currentDist;

  let temperature = initialTemp;
  const history: OptimizationIteration[] = [];
  let acceptedCount = 0;

  for (let iter = 0; iter < maxIterations; iter++) {
    // 2-Opt Neighborhood move: pick two random points and reverse segment
    const i = Math.floor(Math.random() * (n - 1)) + 1;
    const j = Math.floor(Math.random() * (n - 1)) + 1;
    const left = Math.min(i, j);
    const right = Math.max(i, j);

    const candidateTour = [...currentTour];
    // Reverse segment between left and right
    let l = left;
    let r = right;
    while (l < r) {
      const temp = candidateTour[l];
      candidateTour[l] = candidateTour[r];
      candidateTour[r] = temp;
      l++;
      r--;
    }

    const candidateDist = computeTourTotalDistance(candidateTour, distMatrix);
    const delta = candidateDist - currentDist;

    // Metropolis Acceptance Criterion
    let accepted = false;
    if (delta < 0) {
      accepted = true;
    } else {
      const prob = Math.exp(-delta / Math.max(0.001, temperature));
      if (Math.random() < prob) {
        accepted = true;
      }
    }

    if (accepted) {
      currentTour = candidateTour;
      currentDist = candidateDist;
      acceptedCount++;

      if (currentDist < bestDist) {
        bestDist = currentDist;
        bestTour = [...currentTour];
      }
    }

    // Cooling schedule: T_{k+1} = alpha * T_k
    temperature *= coolingRate;

    // Sample history for charts every few iterations
    if (iter % 10 === 0 || iter === maxIterations - 1) {
      history.push({
        iteration: iter + 1,
        bestCost: Math.round(bestDist * 100) / 100,
        currentCost: Math.round(currentDist * 100) / 100,
        temperature: Math.round(temperature * 10) / 10,
        acceptanceRate: Math.round((acceptedCount / (iter + 1)) * 100)
      });
    }
  }

  const endTime = performance.now();
  const executionTimeMs = endTime - startTime;

  const finalRouteIds = [...bestTour.map(i => nodes[i].id), nodes[bestTour[0]].id];
  const totalCost = Math.round(bestDist * 1.85 * 100) / 100;

  return {
    route: finalRouteIds,
    totalDistance: Math.round(bestDist * 100) / 100,
    totalCost,
    computationTimeMs: Math.round(executionTimeMs * 1000) / 1000,
    history,
    algorithm: 'Simulated Annealing (2-Opt Metropolis)',
    timeComplexity: 'O(Iterations * N)',
    spaceComplexity: 'O(N)'
  };
}
