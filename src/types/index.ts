export type LocationType = 'warehouse' | 'distribution_center' | 'retail_hub' | 'customer' | 'port';

export interface LogisticsNode {
  id: string;
  name: string;
  type: LocationType;
  x: number; // For visualization / Euclidean metric (0-1000)
  y: number; // For visualization (0-600)
  demand?: number; // In kg or units
  capacity?: number;
  inventoryCount?: number;
  latitude?: number;
  longitude?: number;
}

export interface LogisticsEdge {
  source: string;
  target: string;
  distance: number; // in km
  travelTime: number; // in minutes
  cost: number; // $ cost
  trafficMultiplier?: number;
  isBlocked?: boolean;
}

export interface Vehicle {
  id: string;
  name: string;
  type: 'Van' | 'Truck' | 'Electric_Cargo_Bike' | 'Heavy_Lorry';
  capacityKg: number;
  volumeM3: number;
  costPerKm: number;
  avgSpeedKmh: number;
  currentLocationId: string;
  status: 'available' | 'in_transit' | 'maintenance';
}

export interface Driver {
  id: string;
  name: string;
  experienceYears: number;
  rating: number; // 1-5
  maxShiftHours: number;
  hoursWorkedToday: number;
  costPerHour: number;
  assignedVehicleId?: string;
  status: 'available' | 'on_duty' | 'off_duty';
}

export interface DeliveryOrder {
  id: string;
  trackingNumber: string;
  customerName: string;
  destinationNodeId: string;
  pickupNodeId: string;
  weightKg: number;
  volumeM3: number;
  deadlineHours: number; // e.g. 2, 4, 8, 24
  customerTier: 'Platinum' | 'Gold' | 'Standard';
  itemValue: number; // $ value
  isPerishable: boolean;
  fragility: 'Low' | 'Medium' | 'High';
  assignedDriverId?: string;
  assignedVehicleId?: string;
  status: 'pending' | 'allocated' | 'in_transit' | 'delivered';
}

export interface InventoryItem {
  id: string;
  warehouseId: string;
  productName: string;
  sku: string;
  category: 'Pharmaceutical' | 'Electronics' | 'Perishables' | 'General Freight' | 'Hardware';
  quantity: number;
  reorderLevel: number;
  unitValue: number;
  weightPerUnitKg: number;
}

export interface AlgorithmMetrics {
  algorithmName: string;
  executionTimeMs: number;
  executionTimeUs: number;
  nodesVisited?: number;
  memoryEstimateKb?: number;
  totalCost?: number;
  totalDistance?: number;
  path?: string[];
  iterations?: number;
  solutionQualityScore?: number; // 0 - 100
  timeComplexity: string;
  spaceComplexity: string;
}

export interface RouteStep {
  fromNode: string;
  toNode: string;
  distance: number;
  cost: number;
  cumulativeDistance: number;
}

export interface CentralityResult {
  nodeId: string;
  nodeName: string;
  nodeType: LocationType;
  degreeCentrality: number;
  normalizedDegree: number;
  closenessCentrality: number;
  betweennessCentrality: number;
  eccentricity: number;
  rank: number;
}

export interface AllocationAssignment {
  vehicle: Vehicle;
  driver?: Driver;
  orders: DeliveryOrder[];
  totalWeightKg: number;
  totalVolumeM3: number;
  totalValueDelivered: number;
  capacityUtilizationPct: number;
  estimatedCost: number;
}

export interface DecisionExplanation {
  factor: string;
  rawScore: number;
  weight: number;
  weightedContribution: number;
  interpretation: string;
}

export interface OrderDecisionScore {
  orderId: string;
  customerName: string;
  compositeScore: number;
  priorityRank: number;
  urgencyClass: 'CRITICAL_EXPRESS' | 'HIGH_PRIORITY' | 'STANDARD' | 'LOW_FLEXIBLE';
  recommendedVehicleType: string;
  recommendedTimeSlot: string;
  explanations: DecisionExplanation[];
  rulesTriggered: string[];
}

export interface OptimizationIteration {
  iteration: number;
  bestCost: number;
  currentCost: number;
  temperature?: number;
  acceptanceRate?: number;
}

export interface TourResult {
  route: string[];
  totalDistance: number;
  totalCost: number;
  computationTimeMs: number;
  history?: OptimizationIteration[];
  algorithm: string;
  timeComplexity: string;
  spaceComplexity: string;
}

export type ActiveModule = 'dashboard' | 'route' | 'allocation' | 'network' | 'decision' | 'optimization' | 'evaluation';
