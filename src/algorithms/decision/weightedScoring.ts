import { DeliveryOrder, OrderDecisionScore, DecisionExplanation, AlgorithmMetrics } from '../../types';

/**
 * Defines the relative importance of each delivery-priority criterion.
 * Custom weights are normalized internally, so they do not have to total exactly 1.
 */
export interface DecisionCriteriaWeights {
  urgencyWeight: number; // Expected range: 0-1
  tierWeight: number;
  valueWeight: number;
  perishabilityWeight: number;
  fragilityWeight: number;
}

/**
 * Default business priorities used when the caller does not provide custom weights.
 * Urgency and customer tier receive the greatest influence on the final score.
 */
export const DEFAULT_CRITERIA_WEIGHTS: DecisionCriteriaWeights = {
  urgencyWeight: 0.35,
  tierWeight: 0.25,
  valueWeight: 0.20,
  perishabilityWeight: 0.12,
  fragilityWeight: 0.08
};

/**
 * Calculates a transparent priority score for every delivery order.
 * Each criterion is converted to a 0-100 score, multiplied by its normalized
 * weight and combined into one composite score for ranking.
 *
 * Time Complexity: O(N * K) where N = orders and K = criteria count
 * Space Complexity: O(N)
 */
export function runWeightedScoring(
  orders: DeliveryOrder[],
  weights: DecisionCriteriaWeights = DEFAULT_CRITERIA_WEIGHTS
): { scores: OrderDecisionScore[]; metrics: AlgorithmMetrics } {
  const startTime = performance.now();

  // Calculate the supplied total so custom weight configurations can be normalized.
  const totalWeightSum =
    weights.urgencyWeight +
    weights.tierWeight +
    weights.valueWeight +
    weights.perishabilityWeight +
    weights.fragilityWeight;

  // Convert every weight into its proportional share of the total.
  const normalizedWeights = {
    urgency: weights.urgencyWeight / totalWeightSum,
    tier: weights.tierWeight / totalWeightSum,
    value: weights.valueWeight / totalWeightSum,
    perishability: weights.perishabilityWeight / totalWeightSum,
    fragility: weights.fragilityWeight / totalWeightSum
  };

  const scores: OrderDecisionScore[] = orders.map(order => {
    // Shorter delivery windows create higher urgency scores.
    // The value is clamped between 0 and 100.
    const urgencyScore = Math.max(
      0,
      Math.min(100, 100 - (order.deadlineHours / 12) * 100)
    );

    // Contract tiers are translated into fixed service-priority scores.
    const tierScore =
      order.customerTier === 'Platinum'
        ? 100
        : order.customerTier === 'Gold'
        ? 70
        : 35;

    // Economic value is measured against a maximum reference value of $30,000.
    const valueScore = Math.min(100, (order.itemValue / 30000) * 100);

    // Perishable goods receive higher priority because of storage and transit limits.
    const perishabilityScore = order.isPerishable ? 100 : 20;

    // Fragility is translated into a handling-priority score.
    const fragilityScore =
      order.fragility === 'High'
        ? 100
        : order.fragility === 'Medium'
        ? 60
        : 20;

    /**
     * Store the contribution of every criterion separately.
     * These records allow the UI to explain how the final score was calculated.
     */
    const explanations: DecisionExplanation[] = [
      {
        factor: 'Delivery Urgency (Deadline)',
        rawScore: Math.round(urgencyScore),
        weight: Math.round(normalizedWeights.urgency * 100) / 100,
        weightedContribution:
          Math.round(urgencyScore * normalizedWeights.urgency * 10) / 10,
        interpretation: `Deadline of ${order.deadlineHours}h generates ${
          urgencyScore > 75 ? 'Critical rush' : 'Standard dispatch'
        } window.`
      },
      {
        factor: 'Customer Tier SLA',
        rawScore: tierScore,
        weight: Math.round(normalizedWeights.tier * 100) / 100,
        weightedContribution:
          Math.round(tierScore * normalizedWeights.tier * 10) / 10,
        interpretation: `${order.customerTier} account SLA tier contractual priority.`
      },
      {
        factor: 'Consignment Economic Value',
        rawScore: Math.round(valueScore),
        weight: Math.round(normalizedWeights.value * 100) / 100,
        weightedContribution:
          Math.round(valueScore * normalizedWeights.value * 10) / 10,
        interpretation: `Insured cargo value of $${order.itemValue.toLocaleString()}.`
      },
      {
        factor: 'Perishability Sensitivity',
        rawScore: perishabilityScore,
        weight: Math.round(normalizedWeights.perishability * 100) / 100,
        weightedContribution:
          Math.round(
            perishabilityScore * normalizedWeights.perishability * 10
          ) / 10,
        interpretation: order.isPerishable
          ? 'Perishable freight requires cold-chain / expedited transit.'
          : 'Non-perishable ambient load.'
      },
      {
        factor: 'Handling Fragility',
        rawScore: fragilityScore,
        weight: Math.round(normalizedWeights.fragility * 100) / 100,
        weightedContribution:
          Math.round(fragilityScore * normalizedWeights.fragility * 10) / 10,
        interpretation: `${order.fragility} fragility classification requiring specialized handling.`
      }
    ];

    // Combine all weighted contributions into one explainable priority score.
    const compositeScore =
      Math.round(
        explanations.reduce(
          (sum, explanation) =>
            sum + explanation.weightedContribution,
          0
        ) * 10
      ) / 10;

    // Begin with the lowest-priority dispatch option before applying thresholds.
    let urgencyClass: OrderDecisionScore['urgencyClass'] = 'LOW_FLEXIBLE';
    let recommendedVehicleType = 'Van';
    let recommendedTimeSlot = 'Slot D: 16:00 - 20:00';

    // Translate the composite score into an urgency class and operational plan.
    if (compositeScore >= 80) {
      urgencyClass = 'CRITICAL_EXPRESS';
      recommendedVehicleType =
        order.weightKg < 180 ? 'Electric_Cargo_Bike' : 'Van';
      recommendedTimeSlot = 'Slot A: Immediate Dispatch (Next 45 min)';
    } else if (compositeScore >= 60) {
      urgencyClass = 'HIGH_PRIORITY';
      recommendedVehicleType = order.weightKg > 1500 ? 'Truck' : 'Van';
      recommendedTimeSlot = 'Slot B: Morning Priority (08:00 - 12:00)';
    } else if (compositeScore >= 40) {
      urgencyClass = 'STANDARD';
      recommendedVehicleType =
        order.weightKg > 2000 ? 'Heavy_Lorry' : 'Truck';
      recommendedTimeSlot = 'Slot C: Afternoon Window (12:00 - 16:00)';
    }

    /**
     * Record additional operational rules triggered by sensitive order attributes.
     * These explanations support auditing and help the UI justify recommendations.
     */
    const rulesTriggered: string[] = [];

    if (order.isPerishable && order.deadlineHours <= 3) {
      rulesTriggered.push(
        'RULE-EXPEDITED-COLDCHAIN: Priority route assignment with temperature logging'
      );
    }

    if (order.customerTier === 'Platinum') {
      rulesTriggered.push(
        'RULE-VIP-SLA: Guaranteed delivery within contract time-window'
      );
    }

    if (order.itemValue > 15000) {
      rulesTriggered.push(
        'RULE-HIGH-VALUE-CARGO: Dedicated tracking and senior driver assignment'
      );
    }

    if (order.weightKg > 2000) {
      rulesTriggered.push(
        'RULE-HEAVY-FREIGHT: Dual-axle vehicle dispatch required'
      );
    }

    return {
      orderId: order.id,
      customerName: order.customerName,
      compositeScore,

      // Ranking is assigned after all orders have been scored and sorted.
      priorityRank: 0,
      urgencyClass,
      recommendedVehicleType,
      recommendedTimeSlot,
      explanations,
      rulesTriggered
    };
  });

  // Sort the highest composite score first and assign sequential priority ranks.
  scores.sort((a, b) => b.compositeScore - a.compositeScore);

  scores.forEach((score, index) => {
    score.priorityRank = index + 1;
  });

  const endTime = performance.now();
  const executionTimeMs = endTime - startTime;

  // Return the ranked decisions together with algorithm-performance measurements.
  return {
    scores,
    metrics: {
      algorithmName: 'Multi-Criteria Weighted Scoring (AHP / WSM)',
      executionTimeMs: Math.round(executionTimeMs * 1000) / 1000,
      executionTimeUs: Math.round(executionTimeMs * 1000),
      nodesVisited: orders.length,
      timeComplexity: 'O(N * K)',
      spaceComplexity: 'O(N)'
    }
  };
}
