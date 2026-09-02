import { DeliveryOrder, AlgorithmMetrics } from '../../types';

/**
 * Represents one historical delivery selected as a nearest neighbour.
 * The distance indicates how similar it is to the order being classified.
 */
export interface KNNNeighbor {
  orderId: string;
  customerName: string;
  distance: number;
  label: 'CRITICAL_EXPRESS' | 'HIGH_PRIORITY' | 'STANDARD' | 'LOW_FLEXIBLE';
}

/**
 * Explainable classification result for one order.
 * The feature vector and nearest neighbours show why the label was assigned.
 */
export interface KNNClassificationResult {
  orderId: string;
  customerName: string;
  predictedLabel: 'CRITICAL_EXPRESS' | 'HIGH_PRIORITY' | 'STANDARD' | 'LOW_FLEXIBLE';
  confidenceScore: number;
  nearestNeighbors: KNNNeighbor[];
  featureVector: number[]; // [normDeadline, normValue, normWeight, tierCode]
}

/**
 * Fixed labelled reference data used by the classifier.
 * Feature order: [deadline ratio, value ratio, weight ratio, customer-tier code].
 * A smaller Euclidean distance represents more similar delivery conditions.
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
 * Classifies delivery urgency using the k-nearest neighbours method.
 * Each order is normalized, compared with historical samples, and assigned
 * the urgency label receiving the most votes from its k closest neighbours.
 *
 * Time Complexity: O(N * M * D)
 * Space Complexity: O(M)
 */
export function runKNNClassification(
  orders: DeliveryOrder[],
  k: number = 3
): { classifications: KNNClassificationResult[]; metrics: AlgorithmMetrics } {
  const startTime = performance.now();

  const classifications: KNNClassificationResult[] = orders.map(order => {
    // Convert hours, value, weight and customer tier into comparable values.
    // Normalization prevents features with larger numeric units from dominating.
    const normDeadline = Math.min(1, Math.max(0, order.deadlineHours / 12));
    const normValue = Math.min(1, Math.max(0, order.itemValue / 30000));
    const normWeight = Math.min(1, Math.max(0, order.weightKg / 3000));
    const tierCode = order.customerTier === 'Platinum' ? 1.0 : order.customerTier === 'Gold' ? 0.7 : 0.35;

    const queryFeatures = [normDeadline, normValue, normWeight, tierCode];

    // Measure similarity against every historical sample using Euclidean distance.
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

    // Sort from most similar to least similar and retain the k closest samples.
    distances.sort((a, b) => a.distance - b.distance);
    const topK = distances.slice(0, k);

    // Apply majority voting across the selected nearest neighbours.
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

    // Confidence is the percentage of neighbours supporting the winning label.
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
