import { DeliveryOrder, AlgorithmMetrics } from '../../types';

/**
 * Defines a single logistics business rule.
 * The predicate checks whether the rule applies to a particular delivery order.
 */
export interface BusinessRule {
  id: string;
  name: string;
  category: 'Safety' | 'SLA' | 'Equipment' | 'Environmental';
  priorityLevel: number; // 1 is the highest priority and 5 is the lowest
  conditionDescription: string;
  actionDescription: string;
  predicate: (order: DeliveryOrder) => boolean;
}

/**
 * Contains the explainable outcome produced after evaluating one order.
 * It records the triggered rules, required equipment and final dispatch decision.
 */
export interface RuleEvaluationResult {
  orderId: string;
  customerName: string;
  triggeredRules: BusinessRule[];
  finalDispatchDecision: string;
  mandatoryEquipment: string[];
  handlingInstructions: string[];
  justificationSummary: string;
}

/**
 * Central collection of operational rules used by the expert system.
 * These rules cover safety, service-level agreements, equipment and sustainability.
 */
export const LOGISTICS_RULESET: BusinessRule[] = [
  {
    id: 'R1-COLDCHAIN',
    name: 'Perishable Expedited Cold-Chain Rule',
    category: 'Safety',
    priorityLevel: 1,
    conditionDescription: 'isPerishable == true AND deadlineHours <= 4',
    actionDescription: 'Mandate temperature-controlled insulated container + immediate dispatch routing',
    predicate: (o) => o.isPerishable && o.deadlineHours <= 4
  },
  {
    id: 'R2-PLATINUM-SLA',
    name: 'Platinum Contract Priority SLA',
    category: 'SLA',
    priorityLevel: 1,
    conditionDescription: 'customerTier == "Platinum"',
    actionDescription: 'Lock top priority time slot with dedicated courier tracking notifications',
    predicate: (o) => o.customerTier === 'Platinum'
  },
  {
    id: 'R3-HEAVY-CARGO',
    name: 'Heavy Freight Dual-Crew Requirement',
    category: 'Equipment',
    priorityLevel: 2,
    conditionDescription: 'weightKg > 1500',
    actionDescription: 'Assign Class-B Heavy Truck with hydraulic lift-gate and dual handling crew',
    predicate: (o) => o.weightKg > 1500
  },
  {
    id: 'R4-HIGH-VALUE',
    name: 'High-Value Consignment Security Protocol',
    category: 'Safety',
    priorityLevel: 2,
    conditionDescription: 'itemValue >= 10000',
    actionDescription: 'Direct-point-to-point transit without secondary hub cross-docking; driver rating >= 4.8',
    predicate: (o) => o.itemValue >= 10000
  },
  {
    id: 'R5-ECO-BIKE',
    name: 'Urban Green Zero-Emission Route',
    category: 'Environmental',
    priorityLevel: 3,
    conditionDescription: 'weightKg <= 100 AND volumeM3 <= 1.0',
    actionDescription: 'Route via Electric Cargo Bike to reduce urban carbon footprint by 85%',
    predicate: (o) => o.weightKg <= 100 && o.volumeM3 <= 1.0
  },
  {
    id: 'R6-FRAGILE-CARE',
    name: 'High Fragility Non-Stackable Rule',
    category: 'Safety',
    priorityLevel: 2,
    conditionDescription: 'fragility == "High"',
    actionDescription: 'Top-tier floor placement; shock-absorbing restraint netting required',
    predicate: (o) => o.fragility === 'High'
  }
];

/**
 * Evaluates every delivery order against the active logistics rules.
 * Triggered rules are ordered by priority and converted into equipment,
 * handling and dispatch recommendations that can be explained to the user.
 *
 * Time Complexity: O(N * R) where N = orders and R = active rules
 * Space Complexity: O(N * R)
 */
export function runRuleBasedExpertSystem(
  orders: DeliveryOrder[],
  rules: BusinessRule[] = LOGISTICS_RULESET
): { results: RuleEvaluationResult[]; metrics: AlgorithmMetrics } {
  const startTime = performance.now();

  const results: RuleEvaluationResult[] = orders.map(order => {
    // Retain only the rules whose predicate conditions match the current order.
    const triggered = rules.filter(r => r.predicate(order));

    // Lower priority numbers represent more important operational rules.
    triggered.sort((a, b) => a.priorityLevel - b.priorityLevel);

    // These collections are populated according to the triggered safety and equipment rules.
    const mandatoryEquipment: string[] = [];
    const handlingInstructions: string[] = [];

    for (const rule of triggered) {
      if (rule.id === 'R1-COLDCHAIN') {
        mandatoryEquipment.push('Insulated Refrigerator Pod (-18°C)');
        handlingInstructions.push('Maintain active thermal telemetry log.');
      }
      if (rule.id === 'R3-HEAVY-CARGO') {
        mandatoryEquipment.push('Hydraulic Tail-Lift', 'Pallet Jack');
        handlingInstructions.push('Two-person team required for offloading.');
      }
      if (rule.id === 'R4-HIGH-VALUE') {
        mandatoryEquipment.push('Tamper-Evident Security Seal');
        handlingInstructions.push('Require dual signature on delivery receipt.');
      }
      if (rule.id === 'R6-FRAGILE-CARE') {
        mandatoryEquipment.push('Air-Cushion Corner Guards');
        handlingInstructions.push('Do NOT stack other cargo on top.');
      }
      if (rule.id === 'R5-ECO-BIKE') {
        mandatoryEquipment.push('Weatherproof Cargo Pannier');
        handlingInstructions.push('Urban cycleway transit approved.');
      }
    }

    // Cold-chain and Platinum SLA rules take precedence over heavy-freight
    // consolidation and the normal scheduled-delivery process.
    const finalDispatchDecision =
      triggered.some(r => r.id === 'R1-COLDCHAIN' || r.id === 'R2-PLATINUM-SLA')
        ? 'EXPEDITED DIRECT DISPATCH'
        : triggered.some(r => r.id === 'R3-HEAVY-CARGO')
        ? 'HEAVY FREIGHT CONSOLIDATION'
        : 'STANDARD SCHEDULED TRANSIT';

    // Produce a readable explanation identifying the rules behind the decision.
    const justificationSummary =
      triggered.length > 0
        ? `Order triggered ${triggered.length} operational rules (${triggered.map(r => r.id).join(', ')}) enforcing specialized SLA and safety compliance.`
        : 'Standard operating procedure applied with default SLA window.';

    return {
      orderId: order.id,
      customerName: order.customerName,
      triggeredRules: triggered,
      finalDispatchDecision,

      // Sets remove repeated equipment or instructions when several rules overlap.
      mandatoryEquipment: Array.from(new Set(mandatoryEquipment)),
      handlingInstructions: Array.from(new Set(handlingInstructions)),
      justificationSummary
    };
  });

  const endTime = performance.now();
  const executionTimeMs = endTime - startTime;

  // Return the decisions together with measurements used for performance analysis.
  return {
    results,
    metrics: {
      algorithmName: 'Rule-Based Inference Expert Engine',
      executionTimeMs: Math.round(executionTimeMs * 1000) / 1000,
      executionTimeUs: Math.round(executionTimeMs * 1000),
      nodesVisited: orders.length * rules.length,
      timeComplexity: 'O(N * R)',
      spaceComplexity: 'O(N)'
    }
  };
}
