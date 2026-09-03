import { DeliveryOrder, Vehicle, Driver, AllocationAssignment, AlgorithmMetrics } from '../../types';
import { AllocationResult } from './greedyAllocation';

export interface GeneticAllocationResult extends AllocationResult {
  fitnessHistory: { generation: number; bestFitness: number; avgFitness: number }[];
  generationsCount: number;
}

/**
 * Genetic Algorithm for Multi-Vehicle & Multi-Driver Resource Allocation.
 *
 * Chromosome:
 * - Each gene represents one delivery order.
 * - The gene value is the index of the assigned vehicle.
 * - -1 means the order is left unassigned.
 *
 * Fitness:
 * - Rewards higher total order value.
 * - Penalizes vehicle weight capacity violations.
 * - Penalizes vehicle volume capacity violations.
 */
export function runGeneticAllocation(
  orders: DeliveryOrder[],
  vehicles: Vehicle[],
  drivers: Driver[],
  populationSize: number = 40,
  generations: number = 30
): GeneticAllocationResult {
  const startTime = performance.now();

  // Only available vehicles and drivers can participate in allocation.
  const activeVehicles = vehicles.filter(v => v.status === 'available');
  const activeDrivers = drivers.filter(d => d.status === 'available');

  const numOrders = orders.length;
  const numVehicles = activeVehicles.length;

  if (numVehicles === 0 || numOrders === 0) {
    return {
      assignments: [],
      unassignedOrders: orders,
      totalValueDelivered: 0,
      totalWeightAllocated: 0,
      averageUtilizationPct: 0,
      fitnessHistory: [],
      generationsCount: 0,
      metrics: {
        algorithmName: 'Genetic Algorithm Allocation',
        executionTimeMs: 0,
        executionTimeUs: 0,
        timeComplexity: 'O(G * P * N)',
        spaceComplexity: 'O(P * N)'
      }
    };
  }

  // Fitness calculation
  // Higher order value increases fitness, while capacity violations reduce fitness.
  const calculateFitness = (chromosome: number[]): { fitness: number; totalVal: number; totalWt: number } => {
    let valueSum = 0;
    let totalWeight = 0;
    const vehicleWeights = new Array(numVehicles).fill(0);
    const vehicleVolumes = new Array(numVehicles).fill(0);

    for (let i = 0; i < numOrders; i++) {
      const vIdx = chromosome[i];
      if (vIdx >= 0 && vIdx < numVehicles) {
        const order = orders[i];
        vehicleWeights[vIdx] += order.weightKg;
        vehicleVolumes[vIdx] += order.volumeM3;
        valueSum += order.itemValue;
        totalWeight += order.weightKg;
      }
    }

    // Apply penalties when a vehicle exceeds its weight or volume capacity.
    let penalties = 0;
    for (let v = 0; v < numVehicles; v++) {
      const vehicle = activeVehicles[v];
      if (vehicleWeights[v] > vehicle.capacityKg) {
        penalties += (vehicleWeights[v] - vehicle.capacityKg) * 15;
      }
      if (vehicleVolumes[v] > vehicle.volumeM3) {
        penalties += (vehicleVolumes[v] - vehicle.volumeM3) * 100;
      }
    }

    const fitness = Math.max(0, valueSum - penalties);
    return { fitness, totalVal: valueSum, totalWt: totalWeight };
  };

  // Create the initial population using random vehicle assignments.
  // A value of -1 represents an order that is not assigned to any vehicle.
  let population: number[][] = [];
  for (let p = 0; p < populationSize; p++) {
    const chromosome: number[] = [];
    for (let i = 0; i < numOrders; i++) {
      // randomly assign to a vehicle or leave unassigned (-1)
      const choice = Math.floor(Math.random() * (numVehicles + 1)) - 1;
      chromosome.push(choice);
    }
    population.push(chromosome);
  }

  const fitnessHistory: { generation: number; bestFitness: number; avgFitness: number }[] = [];
  let bestChromosome = population[0];
  let bestOverallFitness = -Infinity;

  for (let gen = 0; gen < generations; gen++) {
    const evaluated = population.map(chrom => ({
      chromosome: chrom,
      ...calculateFitness(chrom)
    }));

    evaluated.sort((a, b) => b.fitness - a.fitness);

    if (evaluated[0].fitness > bestOverallFitness) {
      bestOverallFitness = evaluated[0].fitness;
      bestChromosome = [...evaluated[0].chromosome];
    }

    const avgFit = evaluated.reduce((sum, item) => sum + item.fitness, 0) / populationSize;
    fitnessHistory.push({
      generation: gen + 1,
      bestFitness: Math.round(evaluated[0].fitness),
      avgFitness: Math.round(avgFit)
    });

    // Selection: Top 20% Elites survive directly
    const eliteCount = Math.max(2, Math.floor(populationSize * 0.2));
    const nextGeneration: number[][] = evaluated.slice(0, eliteCount).map(e => [...e.chromosome]);

    // Fill remaining population with crossover and mutation
    while (nextGeneration.length < populationSize) {
      // Select parents randomly from the top half of the population.
      const parentA = evaluated[Math.floor(Math.random() * (populationSize / 2))].chromosome;
      const parentB = evaluated[Math.floor(Math.random() * (populationSize / 2))].chromosome;

      // Two-point crossover: copy a segment from parent A and the remaining genes from parent B.
      const pt1 = Math.floor(Math.random() * numOrders);
      const pt2 = Math.floor(Math.random() * numOrders);
      const start = Math.min(pt1, pt2);
      const end = Math.max(pt1, pt2);

      const child: number[] = [];
      for (let i = 0; i < numOrders; i++) {
        if (i >= start && i <= end) {
          child.push(parentA[i]);
        } else {
          child.push(parentB[i]);
        }
      }

      // Mutation: each gene has a 10% chance of being assigned a new random vehicle.
      for (let i = 0; i < numOrders; i++) {
        if (Math.random() < 0.1) {
          child[i] = Math.floor(Math.random() * (numVehicles + 1)) - 1;
        }
      }

      nextGeneration.push(child);
    }

    population = nextGeneration;
  }

  const endTime = performance.now();
  const executionTimeMs = endTime - startTime;

  // Convert the best chromosome found by the genetic algorithm
  // into the final vehicle-order assignments.
  const assignments: AllocationAssignment[] = activeVehicles.map((vehicle, idx) => ({
    vehicle,
    driver: activeDrivers[idx % Math.max(1, activeDrivers.length)],
    orders: [],
    totalWeightKg: 0,
    totalVolumeM3: 0,
    totalValueDelivered: 0,
    capacityUtilizationPct: 0,
    estimatedCost: 0
  }));

  const unassignedOrders: DeliveryOrder[] = [];

  for (let i = 0; i < numOrders; i++) {
    const vIdx = bestChromosome[i];
    if (vIdx >= 0 && vIdx < numVehicles) {
      const target = assignments[vIdx];
      target.orders.push(orders[i]);
      target.totalWeightKg += orders[i].weightKg;
      target.totalVolumeM3 += orders[i].volumeM3;
      target.totalValueDelivered += orders[i].itemValue;
    } else {
      unassignedOrders.push(orders[i]);
    }
  }

  for (const assign of assignments) {
    assign.capacityUtilizationPct = Math.round((assign.totalWeightKg / assign.vehicle.capacityKg) * 1000) / 10;
    assign.estimatedCost = Math.round((assign.vehicle.costPerKm * 35 + (assign.driver?.costPerHour || 22) * 3) * 100) / 100;
  }

  const totalValueDelivered = assignments.reduce((acc, a) => acc + a.totalValueDelivered, 0);
  const totalWeightAllocated = assignments.reduce((acc, a) => acc + a.totalWeightKg, 0);
  const activeAssignments = assignments.filter(a => a.orders.length > 0);
  const avgUtilization = activeAssignments.length > 0
    ? activeAssignments.reduce((acc, a) => acc + a.capacityUtilizationPct, 0) / activeAssignments.length
    : 0;

  return {
    assignments,
    unassignedOrders,
    totalValueDelivered,
    totalWeightAllocated,
    averageUtilizationPct: Math.round(avgUtilization * 10) / 10,
    fitnessHistory,
    generationsCount: generations,
    metrics: {
      algorithmName: 'Genetic Algorithm (Stochastic Metaheuristic)',
      executionTimeMs: Math.round(executionTimeMs * 1000) / 1000,
      executionTimeUs: Math.round(executionTimeMs * 1000),
      iterations: generations,
      solutionQualityScore: Math.round((totalValueDelivered / Math.max(1, orders.reduce((s, o) => s + o.itemValue, 0))) * 100),
      timeComplexity: 'O(G * P * N)',
      spaceComplexity: 'O(P * N)'
    }
  };
}
