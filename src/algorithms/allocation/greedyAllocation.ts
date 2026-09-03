import { DeliveryOrder, Vehicle, Driver, AllocationAssignment, AlgorithmMetrics } from '../../types';

export interface AllocationResult {
  assignments: AllocationAssignment[];
  unassignedOrders: DeliveryOrder[];
  totalValueDelivered: number;
  totalWeightAllocated: number;
  averageUtilizationPct: number;
  metrics: AlgorithmMetrics;
}

/**
 * Greedy Resource Allocation
 *
 * Strategy:
 * 1. Calculate a priority score for each order using customer tier,
 *    item value, weight, and deadline.
 * 2. Process orders from the highest score to the lowest score.
 * 3. Assign each order to the available vehicle that fits the order
 *    while leaving the smallest remaining weight capacity.
 *
 * Time Complexity: O(N log N + N * M) where N = orders, M = vehicles
 * Space Complexity: O(N + M)
 */
export function runGreedyAllocation(
  orders: DeliveryOrder[],
  vehicles: Vehicle[],
  drivers: Driver[]
): AllocationResult {
  const startTime = performance.now();

  // Select only vehicles and drivers that are currently available.
  const availableVehicles = vehicles.filter(v => v.status === 'available');
  const availableDrivers = drivers.filter(d => d.status === 'available');

  const assignments: AllocationAssignment[] = availableVehicles.map((vehicle, idx) => ({
    vehicle,
    driver: availableDrivers[idx % Math.max(1, availableDrivers.length)],
    orders: [],
    totalWeightKg: 0,
    totalVolumeM3: 0,
    totalValueDelivered: 0,
    capacityUtilizationPct: 0,
    estimatedCost: 0
  }));

  // Calculate a priority score for each order.
  // Higher-value, higher-priority, lighter, and more urgent orders receive higher scores.
  const tierWeights = { Platinum: 3.0, Gold: 2.0, Standard: 1.0 };
  // Process the highest-priority orders first.
  const sortedOrders = [...orders].sort((a, b) => {
    const scoreA = (a.itemValue * tierWeights[a.customerTier]) / (a.weightKg * Math.max(0.5, a.deadlineHours));
    const scoreB = (b.itemValue * tierWeights[b.customerTier]) / (b.weightKg * Math.max(0.5, b.deadlineHours));
    return scoreB - scoreA;
  });

  const unassignedOrders: DeliveryOrder[] = [];

  for (const order of sortedOrders) {
    let assigned = false;

    // Find best fitting vehicle (Best Fit: minimizes remaining space without exceeding)
    let bestAssignmentIndex = -1;
    let minRemainingCapacity = Infinity;

    for (let i = 0; i < assignments.length; i++) {
      const assign = assignments[i];
      // Check both weight and volume constraints before assigning the order.
      const wouldExceedWeight = assign.totalWeightKg + order.weightKg > assign.vehicle.capacityKg;
      const wouldExceedVolume = assign.totalVolumeM3 + order.volumeM3 > assign.vehicle.volumeM3;

      if (!wouldExceedWeight && !wouldExceedVolume) {
        const remaining = assign.vehicle.capacityKg - (assign.totalWeightKg + order.weightKg);
        if (remaining < minRemainingCapacity) {
          minRemainingCapacity = remaining;
          bestAssignmentIndex = i;
        }
      }
    }

    // Assign the order to the best-fit vehicle if a suitable vehicle was found.
    if (bestAssignmentIndex !== -1) {
      const target = assignments[bestAssignmentIndex];
      target.orders.push(order);
      target.totalWeightKg += order.weightKg;
      target.totalVolumeM3 += order.volumeM3;
      target.totalValueDelivered += order.itemValue;
      target.capacityUtilizationPct = Math.round((target.totalWeightKg / target.vehicle.capacityKg) * 1000) / 10;
      target.estimatedCost = Math.round((target.vehicle.costPerKm * 35 + (target.driver?.costPerHour || 20) * 3) * 100) / 100;
      assigned = true;
    }

    // Keep the order unassigned when no available vehicle can satisfy its constraints.
    if (!assigned) {
      unassignedOrders.push(order);
    }
  }

  const endTime = performance.now();
  const executionTimeMs = endTime - startTime;

  // Calculate summary metrics for the completed allocation.
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
    metrics: {
      algorithmName: 'Greedy Heuristic Allocation',
      executionTimeMs: Math.round(executionTimeMs * 1000) / 1000,
      executionTimeUs: Math.round(executionTimeMs * 1000),
      solutionQualityScore: Math.round((totalValueDelivered / Math.max(1, orders.reduce((s, o) => s + o.itemValue, 0))) * 100),
      timeComplexity: 'O(N log N + N * M)',
      spaceComplexity: 'O(N + M)'
    }
  };
}
