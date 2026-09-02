import { LogisticsNode, TourResult, OptimizationIteration } from '../../types';
import { calculateDistanceMatrix, computeTourTotalDistance } from './tspDP';

/**
 * Simulated Annealing algorithm for improving a vehicle route.
 * Uses 2-opt to create new routes and accepts some worse routes
 * to avoid getting stuck in a local optimum.
 */
export function runSimulatedAnnealing(
  nodes: LogisticsNode[],
  initialTemp: number = 1000,
  coolingRate: number = 0.985,
  maxIterations: number = 500
): TourResult {
  // Start measuring execution time
  const startTime = performance.now();

  const n = nodes.length;

  // Calculate the distance between every pair of locations
  const distMatrix = calculateDistanceMatrix(nodes);

  // Create the initial route: [0, 1, 2, ..., n-1]
  let currentTour: number[] = Array.from({ length: n }, (_, i) => i);

  // Calculate the distance of the initial route
  let currentDist = computeTourTotalDistance(currentTour, distMatrix);

  // Store the best route found so far
  let bestTour = [...currentTour];
  let bestDist = currentDist;

  // Set the starting temperature
  let temperature = initialTemp;

  // Store optimization progress for the chart
  const history: OptimizationIteration[] = [];

  // Count how many solutions were accepted
  let acceptedCount = 0;

  // Repeat the optimization process
  for (let iter = 0; iter < maxIterations; iter++) {

    // Select two random positions for the 2-opt operation
    const i = Math.floor(Math.random() * (n - 1)) + 1;
    const j = Math.floor(Math.random() * (n - 1)) + 1;

    const left = Math.min(i, j);
    const right = Math.max(i, j);

    // Create a copy of the current route
    const candidateTour = [...currentTour];

    // Reverse the selected section of the route
    let l = left;
    let r = right;

    while (l < r) {
      const temp = candidateTour[l];
      candidateTour[l] = candidateTour[r];
      candidateTour[r] = temp;

      l++;
      r--;
    }

    // Calculate the distance of the new route
    const candidateDist = computeTourTotalDistance(candidateTour, distMatrix);

    // Find the difference between the new and current route
    const delta = candidateDist - currentDist;

    // Decide whether to accept the new route
    let accepted = false;

    // Always accept a better route
    if (delta < 0) {
      accepted = true;
    } else {

      // Sometimes accept a worse route to escape local optimum
      const prob = Math.exp(-delta / Math.max(0.001, temperature));

      if (Math.random() < prob) {
        accepted = true;
      }
    }

    // Update the current route if it was accepted
    if (accepted) {
      currentTour = candidateTour;
      currentDist = candidateDist;
      acceptedCount++;

      // Save the route if it is the best one found
      if (currentDist < bestDist) {
        bestDist = currentDist;
        bestTour = [...currentTour];
      }
    }

    // Reduce the temperature after each iteration
    temperature *= coolingRate;

    // Save progress every 10 iterations for visualization
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

  // Stop measuring execution time
  const endTime = performance.now();
  const executionTimeMs = endTime - startTime;

  // Convert route indexes into actual location IDs
  // Add the starting location at the end to complete the tour
  const finalRouteIds = [
    ...bestTour.map(i => nodes[i].id),
    nodes[bestTour[0]].id
  ];

  // Calculate the final route cost
  const totalCost = Math.round(bestDist * 1.85 * 100) / 100;

  // Return the final optimization result
  return {
    route: finalRouteIds,
    totalDistance: Math.round(bestDist * 100) / 100,
    totalCost,
    computationTimeMs: Math.round(executionTimeMs * 1000) / 1000,
    history,

    // Algorithm information
    algorithm: 'Simulated Annealing (2-Opt Metropolis)',
    timeComplexity: 'O(Iterations * N)',
    spaceComplexity: 'O(N)'
  };
}
