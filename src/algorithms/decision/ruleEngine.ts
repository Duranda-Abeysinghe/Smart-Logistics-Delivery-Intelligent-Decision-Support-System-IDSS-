import { DeliveryOrder } from '../../types';

export interface BusinessRule {
  id: string;
  name: string;
  category: 'Safety' | 'SLA' | 'Equipment' | 'Environmental';
  priorityLevel: number; // 1 (Highest) to 5
  conditionDescription: string;
  actionDescription: string;
  predicate: (order: DeliveryOrder) => boolean;
}

export interface RuleEvaluationResult {
  orderId: string;
  customerName: string;
  triggeredRules: BusinessRule[];
  finalDispatchDecision: string;
  mandatoryEquipment: string[];
  handlingInstructions: string[];
  justificationSummary: string;
}

export const LOGISTICS_RULESET: BusinessRule[] = [
  {
    id: 'R1-COLDCHAIN',
    name: 'Perishable Expedited Cold-Chain Rule',
    category: 'Safety',
    priorityLevel: 1,
    conditionDescription: 'isPerishable == true AND deadlineHours <= 4',
    actionDescription:
      'Mandate temperature-controlled insulated container + immediate dispatch routing',
    predicate: (o) => o.isPerishable && o.deadlineHours <= 4
  },
  {
    id: 'R2-PLATINUM-SLA',
    name: 'Platinum Contract Priority SLA',
    category: 'SLA',
    priorityLevel: 1,
    conditionDescription: 'customerTier == "Platinum"',
    actionDescription:
      'Lock top priority time slot with dedicated courier tracking notifications',
    predicate: (o) => o.customerTier === 'Platinum'
  },
  {
    id: 'R3-HEAVY-CARGO',
    name: 'Heavy Freight Dual-Crew Requirement',
    category: 'Equipment',
    priorityLevel: 2,
    conditionDescription: 'weightKg > 1500',
    actionDescription:
      'Assign Class-B Heavy Truck with hydraulic lift-gate and dual handling crew',
    predicate: (o) => o.weightKg > 1500
  },
  {
    id: 'R4-HIGH-VALUE',
    name: 'High-Value Consignment Security Protocol',
    category: 'Safety',
    priorityLevel: 2,
    conditionDescription: 'itemValue >= 10000',
    actionDescription:
      'Direct-point-to-point transit without secondary hub cross-docking; driver rating >= 4.8',
    predicate: (o) => o.itemValue >= 10000
  },
  {
    id: 'R5-ECO-BIKE',
    name: 'Urban Green Zero-Emission Route',
    category: 'Environmental',
    priorityLevel: 3,
    conditionDescription: 'weightKg <= 100 AND volumeM3 <= 1.0',
    actionDescription:
      'Route via Electric Cargo Bike to reduce urban carbon footprint by 85%',
    predicate: (o) => o.weightKg <= 100 && o.volumeM3 <= 1.0
  },
  {
    id: 'R6-FRAGILE-CARE',
    name: 'High Fragility Non-Stackable Rule',
    category: 'Safety',
    priorityLevel: 2,
    conditionDescription: 'fragility == "High"',
    actionDescription:
      'Top-tier floor placement; shock-absorbing restraint netting required',
    predicate: (o) => o.fragility === 'High'
  }
];