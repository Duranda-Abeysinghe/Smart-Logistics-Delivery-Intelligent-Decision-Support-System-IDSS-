import { DeliveryOrder, AlgorithmMetrics } from '../../types';

export interface KNNNeighbor {
  orderId: string;
  customerName: string;
  distance: number;
  label: 'CRITICAL_EXPRESS' | 'HIGH_PRIORITY' | 'STANDARD' | 'LOW_FLEXIBLE';
}

export interface KNNClassificationResult {
  orderId: string;
  customerName: string;
  predictedLabel: 'CRITICAL_EXPRESS' | 'HIGH_PRIORITY' | 'STANDARD' | 'LOW_FLEXIBLE';
  confidenceScore: number;
  nearestNeighbors: KNNNeighbor[];
  featureVector: number[]; // [normDeadline, normValue, normWeight, tierCode]
}

/**
 * Historical labeled training samples representing logistics operational baselines
 */
const HISTORICAL_SAMPLES = [
  { features: [0.1, 0.95, 0.05, 1.0], label: 'CRITICAL_EXPRESS' as const, name: 'Emergency Pharma Delivery #H1' },
  { features: [0.15, 0.85, 0.12, 1.0], label: 'CRITICAL_EXPRESS' as const, name: 'Organ Courier Transit #H2' },
  { features: [0.2, 0.90, 0.20, 1.0], label: 'CRITICAL_EXPRESS' as const, name: 'Critical Server Hardware #H3' },
  { features: [0.35, 0.60, 0.40, 0.7], label: 'HIGH_PRIORITY' as const, name: 'Hospital Supplies Batch #H4' },
  { features: [0.30, 0.70, 0.35, 0.7], label: 'HIGH_PRIORITY' as const, name: 'Retail Flash Sale Express #H5' },
  { features: [0.45, 0.50, 0.50, 0.7], label: 'HIGH_PRIORITY' as const, name: 'Automotive Spare Parts #H6' },
  { features: [0.70, 0.30, 0.70, 0.35], label: 'STANDARD' as const, name: 'FMCG Warehouse Restock #H7' },
  { features: [0.65, 0.25, 0.80, 0.35], label: 'STANDARD' as const, name: 'Home Appliances Transit #H8' },
  { features: [0.80, 0.40, 0.60, 0.35], label: 'STANDARD' as const, name: 'Office Furniture Consignment #H9' },
  { features: [0.95, 0.15, 0.90, 0.35], label: 'LOW_FLEXIBLE' as const, name: 'Bulk Construction Aggregate #H10' },
  { features: [0.90, 0.10, 0.95, 0.35], label: 'LOW_FLEXIBLE' as const, name: 'Scrap Metal Recycling Batch #H11' }
];

/**
 * k-Nearest Neighbors (k-NN) Classification for Order Urgency
 * Time Complexity: O(N * M * D) where N = query orders, M = historical instances, D = dimensions
 * Space Complexity: O(M)
 */
export function runKNNClassification(
  orders: DeliveryOrder[],
  k: number = 3
): { classifications: KNNClassificationResult[]; metrics: AlgorithmMetrics } {
  const startTime = performance.now();

  const classifications: KNNClassificationResult[] = orders.map(order => {
    // Construct normalized feature vector
    // [normDeadline (0-1), normValue (0-1), normWeight (0-1), tierCode (0.35 - 1.0)]
    const normDeadline = Math.min(1, Math.max(0, order.deadlineHours / 12));
    const normValue = Math.min(1, Math.max(0, order.itemValue / 30000));
    const normWeight = Math.min(1, Math.max(0, order.weightKg / 3000));
    const tierCode = order.customerTier === 'Platinum' ? 1.0 : order.customerTier === 'Gold' ? 0.7 : 0.35;

    const queryFeatures = [normDeadline, normValue, normWeight, tierCode];

    // Compute Euclidean distances to all training instances
    const distances: KNNNeighbor[] = HISTORICAL_SAMPLES.map((sample, idx) => {
      let sumSq = 0;
      for (let d = 0; d < 4; d++) {
        const diff = queryFeatures[d] - sample.features[d];
        sumSq += diff * diff;
      }
      const dist = Math.sqrt(sumSq);
      return {
        orderId: `HIST-${idx + 1}`,
        customerName: sample.name,
        distance: Math.round(dist * 1000) / 1000,
        label: sample.label
      };
    });

    distances.sort((a, b) => a.distance - b.distance);
    const topK = distances.slice(0, k);

    // Vote tally
    const voteCounts: Record<string, number> = {};
    for (const neighbor of topK) {
      voteCounts[neighbor.label] = (voteCounts[neighbor.label] || 0) + 1;
    }

    let winningLabel: KNNClassificationResult['predictedLabel'] = 'STANDARD';
    let maxVotes = -1;

    for (const [label, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        winningLabel = label as KNNClassificationResult['predictedLabel'];
      }
    }

    const confidence = Math.round((maxVotes / k) * 100);

    return {
      orderId: order.id,
      customerName: order.customerName,
      predictedLabel: winningLabel,
      confidenceScore: confidence,
      nearestNeighbors: topK,
      featureVector: queryFeatures.map(f => Math.round(f * 100) / 100)
    };
  });

  const endTime = performance.now();
  const executionTimeMs = endTime - startTime;

  return {
    classifications,
    metrics: {
      algorithmName: `k-Nearest Neighbors (k=${k}) Classifier`,
      executionTimeMs: Math.round(executionTimeMs * 1000) / 1000,
      executionTimeUs: Math.round(executionTimeMs * 1000),
      nodesVisited: orders.length * HISTORICAL_SAMPLES.length,
      timeComplexity: 'O(N * M * D)',
      spaceComplexity: 'O(M)'
    }
  };
}
