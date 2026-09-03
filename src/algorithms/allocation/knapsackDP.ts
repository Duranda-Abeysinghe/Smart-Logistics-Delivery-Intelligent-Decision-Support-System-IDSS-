import { DeliveryOrder, Vehicle, Driver, AllocationAssignment, AlgorithmMetrics } from '../../types';
import { AllocationResult } from './greedyAllocation';

export interface KnapsackDPResult extends AllocationResult {
  dpTablePreview: {
    itemLabels: string[];
    capacityHeaders: number[];
    matrix: number[][];
  };
}


/**
 * 0/1 Knapsack Dynamic Programming for Single/Primary Vehicle Allocation.
 *
 * Strategy:
 * - Each order can either be selected (1) or not selected (0).
 * - The algorithm maximizes the total value of selected orders
 *   without exceeding the primary vehicle's weight capacity.
 * - Weight is scaled into discrete 50kg units to keep the DP table manageable.
 *
 * Time Complexity: O(N * W)
 * Space Complexity: O(N * W)
 * N = number of orders, W = scaled vehicle capacity.
 */
export function runKnapsackDP(
  orders: DeliveryOrder[],
  vehicles: Vehicle[],
  drivers: Driver[]
): KnapsackDPResult {
  const startTime = performance.now();

  const primaryVehicle = vehicles[0] || {
    id: 'V-DEFAULT',
    name: 'Primary Transport Van',
    type: 'Van',
    capacityKg: 2000,
    volumeM3: 20,
    costPerKm: 1.5,
    avgSpeedKmh: 45,
    currentLocationId: 'W1',
    status: 'available'
  };

  const primaryDriver = drivers[0];

  // Scale capacity to make DP table efficient & discrete (step of 50kg)
  const scale = 50;
  const W = Math.floor(primaryVehicle.capacityKg / scale);
  const n = orders.length;

  // dp[i][w] stores the maximum value that can be achieved
  // using the first i orders within a capacity of w * scale kilograms.ity w*scale
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const order = orders[i - 1];
    const itemWeightDiscrete = Math.max(1, Math.ceil(order.weightKg / scale));
    const itemVal = order.itemValue;

    for (let w = 0; w <= W; w++) {
      if (itemWeightDiscrete <= w) {
        // Choose the better option:
        // 1. Exclude the current order.
        // 2. Include the current order and add its value to the best previous solution.
        dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - itemWeightDiscrete] + itemVal);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  // Backtrack through the DP table to identify which orders were selected
  // in the optimal solution.
  const selectedOrders: DeliveryOrder[] = [];
  let currW = W;
  for (let i = n; i > 0; i--) {
    // If the value changed, the current order was included in the solution.
    if (dp[i][currW] !== dp[i - 1][currW]) {
      selectedOrders.push(orders[i - 1]);
      const itemWeightDiscrete = Math.max(1, Math.ceil(orders[i - 1].weightKg / scale));
      currW -= itemWeightDiscrete;
    }
  }

  // Orders not included in the optimal solution remain unassigned.
  const selectedIds = new Set(selectedOrders.map(o => o.id));
  const unassignedOrders = orders.filter(o => !selectedIds.has(o.id));

  const totalWeight = selectedOrders.reduce((sum, o) => sum + o.weightKg, 0);
  const totalVolume = selectedOrders.reduce((sum, o) => sum + o.volumeM3, 0);
  const totalValue = selectedOrders.reduce((sum, o) => sum + o.itemValue, 0);

  const primaryAssignment: AllocationAssignment = {
    vehicle: primaryVehicle,
    driver: primaryDriver,
    orders: selectedOrders,
    totalWeightKg: totalWeight,
    totalVolumeM3: Math.round(totalVolume * 10) / 10,
    totalValueDelivered: totalValue,
    capacityUtilizationPct: Math.round((totalWeight / primaryVehicle.capacityKg) * 1000) / 10,
    estimatedCost: Math.round((primaryVehicle.costPerKm * 40 + (primaryDriver?.costPerHour || 25) * 4) * 100) / 100
  };

  const endTime = performance.now();
  const executionTimeMs = endTime - startTime;

  // Build a smaller DP table preview for visualization.
  // Only selected capacity columns are included to reduce the display size.
  const sampleStep = Math.max(1, Math.floor(W / 8));
  const capacityHeaders: number[] = [];
  for (let c = 0; c <= W; c += sampleStep) {
    capacityHeaders.push(c * scale);
  }

  const previewMatrix: number[][] = [];
  const itemLabels: string[] = ['Baseline 0'];

  for (let i = 0; i <= n; i++) {
    if (i > 0) itemLabels.push(`${orders[i - 1].id} (${orders[i - 1].weightKg}kg)`);
    const row: number[] = [];
    for (let c = 0; c <= W; c += sampleStep) {
      row.push(dp[i][c]);
    }
    previewMatrix.push(row);
  }

  return {
    assignments: [primaryAssignment],
    unassignedOrders,
    totalValueDelivered: totalValue,
    totalWeightAllocated: totalWeight,
    averageUtilizationPct: primaryAssignment.capacityUtilizationPct,
    dpTablePreview: {
      itemLabels,
      capacityHeaders,
      matrix: previewMatrix
    },
    metrics: {
      algorithmName: '0/1 Knapsack Dynamic Programming',
      executionTimeMs: Math.round(executionTimeMs * 1000) / 1000,
      executionTimeUs: Math.round(executionTimeMs * 1000),
      nodesVisited: (n + 1) * (W + 1),
      solutionQualityScore: 100, // Exact optimal for single-capacity
      timeComplexity: 'O(N * W)',
      spaceComplexity: 'O(N * W)'
    }
  };
}
