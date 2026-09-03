// ============================================================
// Smart Logistics & Delivery IDSS - Core Type Definitions
// Shared types used across route optimization, allocation,
// network analysis, decision support, and evaluation modules.
// ============================================================

// Classifies what kind of physical location a node represents in the logistics network
export type LocationType = 'warehouse' | 'distribution_center' | 'retail_hub' | 'customer' | 'port';

// Represents a single point/node in the logistics network graph
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

// Represents a connection (route segment) between two LogisticsNodes
export interface LogisticsEdge {
  source: string;
  target: string;
  distance: number; // in km
  travelTime: number; // in minutes
  cost: number; // $ cost
  trafficMultiplier?: number;
  isBlocked?: boolean;
}

// Represents a delivery vehicle available in the fleet
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

// Represents a driver who can be assigned to a vehicle
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

// Represents a single customer delivery order to be routed and allocated
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

// Represents a stock item held at a specific warehouse
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

// Captures performance/diagnostic metrics for a given algorithm run
// (used to compare algorithms in the evaluation module)
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

// Represents one leg/hop of a computed route, including running totals
export interface RouteStep {
  fromNode: string;
  toNode: string;
  distance: number;
  cost: number;
  cumulativeDistance: number;
}

// Holds graph centrality metrics for a node
// (used in the network analysis module to identify key hubs)
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

// Represents the result of assigning a set of orders to a vehicle/driver pair
// (output of the allocation module)
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

// Represents a single factor/criterion contributing to a decision score,
// used to make the decision support system's reasoning explainable
export interface DecisionExplanation {
  factor: string;
  rawScore: number;
  weight: number;
  weightedContribution: number;
  interpretation: string;
}

// Represents the overall priority scoring result for an order,
// combining multiple weighted DecisionExplanation factors
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

// Represents a single iteration snapshot during an iterative optimization
// process (e.g. simulated annealing), used to visualize convergence
export interface OptimizationIteration {
  iteration: number;
  bestCost: number;
  currentCost: number;
  temperature?: number;
  acceptanceRate?: number;
}

// Represents the final result of a route optimization run (e.g. TSP-style tour),
// including optional iteration history for charting convergence
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

// Identifies which top-level module/tab of the app is currently active
export type ActiveModule = 'dashboard' | 'route' | 'allocation' | 'network' | 'decision' | 'optimization' | 'evaluation';
