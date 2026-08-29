import { LogisticsNode, TourResult, OptimizationIteration } from '../../types';
import { calculateDistanceMatrix, computeTourTotalDistance } from './tspDP';


/**
 * Permutation-based Genetic Algorithm for TSP
 * Employs Ordered Crossover (OX1), Inversion Mutation, and Elitism
 * Time Complexity: O(Generations * PopSize * N)
 * Space Complexity: O(PopSize * N)
 */
export function runGeneticTSP(
  nodes: LogisticsNode[],
  popSize: number = 50,
  generations: number = 60
): TourResult {
  const startTime = performance.now();
  const n = nodes.length;
  const distMatrix = calculateDistanceMatrix(nodes);

  // Helper to generate random permutation tour
  const randomTour = (): number[] => {
    const indices = Array.from({ length: n - 1 }, (_, i) => i + 1);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return [0, ...indices]; // Fixed start node 0
  };

  let population: number[][] = Array.from({ length: popSize }, () => randomTour());
  let bestTour = population[0];
  let bestDist = computeTourTotalDistance(bestTour, distMatrix);

  const history: OptimizationIteration[] = [];

  for (let gen = 0; gen < generations; gen++) {
    const fitnessScores = population.map(chrom => ({
      chromosome: chrom,
      dist: computeTourTotalDistance(chrom, distMatrix),
      fitness: 100000 / (computeTourTotalDistance(chrom, distMatrix) + 1)
    }));

    fitnessScores.sort((a, b) => b.fitness - a.fitness);

    if (fitnessScores[0].dist < bestDist) {
      bestDist = fitnessScores[0].dist;
      bestTour = [...fitnessScores[0].chromosome];
    }

    history.push({
      iteration: gen + 1,
      bestCost: Math.round(bestDist * 100) / 100,
      currentCost: Math.round(fitnessScores[0].dist * 100) / 100
    });

    // Elitism: Keep top 20%
    const eliteCount = Math.max(2, Math.floor(popSize * 0.2));
    const nextGen: number[][] = fitnessScores.slice(0, eliteCount).map(f => [...f.chromosome]);

    // Fill population with Ordered Crossover (OX1)
    while (nextGen.length < popSize) {
      const p1 = fitnessScores[Math.floor(Math.random() * (popSize / 2))].chromosome;
      const p2 = fitnessScores[Math.floor(Math.random() * (popSize / 2))].chromosome;

      const idx1 = Math.floor(Math.random() * (n - 1)) + 1;
      const idx2 = Math.floor(Math.random() * (n - 1)) + 1;
      const start = Math.min(idx1, idx2);
      const end = Math.max(idx1, idx2);

      const child: (number | null)[] = Array(n).fill(null);
      child[0] = 0; // Fixed depot

      // Copy slice from parent 1
      const inChild = new Set<number>([0]);
      for (let i = start; i <= end; i++) {
        child[i] = p1[i];
        inChild.add(p1[i]);
      }

      // Fill remaining from parent 2 in order
      let p2Index = 1;
      for (let i = 1; i < n; i++) {
        if (child[i] === null) {
          while (inChild.has(p2[p2Index])) {
            p2Index++;
          }
          child[i] = p2[p2Index];
          inChild.add(p2[p2Index]);
          p2Index++;
        }
      }

      const finalChild = child as number[];

      // Inversion Mutation (15% probability)
      if (Math.random() < 0.15 && n > 3) {
        const m1 = Math.floor(Math.random() * (n - 1)) + 1;
        const m2 = Math.floor(Math.random() * (n - 1)) + 1;
        const ms = Math.min(m1, m2);
        const me = Math.max(m1, m2);
        let l = ms;
        let r = me;
        while (l < r) {
          [finalChild[l], finalChild[r]] = [finalChild[r], finalChild[l]];
          l++;
          r--;
        }
      }

      nextGen.push(finalChild);
    }

    population = nextGen;
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
    algorithm: 'Permutation Genetic Algorithm (OX1 Crossover)',
    timeComplexity: 'O(Generations * PopSize * N)',
    spaceComplexity: 'O(PopSize * N)'
  };
}
