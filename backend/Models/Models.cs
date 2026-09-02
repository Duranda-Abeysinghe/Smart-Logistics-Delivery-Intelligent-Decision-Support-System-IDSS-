using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartLogistics.IDSS.Models
{
    // ==========================================
    // 1. Locations Entity & DTOs
    // ==========================================
    // Represents a single node in the logistics network (warehouse, distribution
    // center, retail hub, customer, or port). Maps to the "locations" table.
    [Table("locations")]
    public class Location
    {
        // Primary key - human-readable location code (e.g. "WH-01")
        [Key]
        [Column("location_id")]
        [StringLength(32)]
        public string LocationId { get; set; } = string.Empty;

        // Display name of the location
        [Required]
        [Column("name")]
        [StringLength(128)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [Column("type")]
        [StringLength(32)]
        public string Type { get; set; } = string.Empty; // warehouse, distribution_center, retail_hub, customer, port

        // X/Y coordinates used for the 2D map visualization and as the basis
        // for the Euclidean heuristic in A* search (not real-world units)
        [Column("coord_x")]
        public int CoordX { get; set; }

        [Column("coord_y")]
        public int CoordY { get; set; }

        // Optional real-world GPS coordinates, for locations that have them
        [Column("latitude", TypeName = "decimal(10, 7)")]
        public decimal? Latitude { get; set; }

        [Column("longitude", TypeName = "decimal(10, 7)")]
        public decimal? Longitude { get; set; }

        // Max storage/throughput capacity, applicable to warehouses/hubs
        [Column("capacity")]
        public int? Capacity { get; set; }

        // Current stock count, applicable to warehouses
        [Column("inventory_count")]
        public int? InventoryCount { get; set; }

        // Expected demand at this node, used in allocation/decision calculations
        [Column("demand")]
        public int? Demand { get; set; }
    }

    // ==========================================
    // 2. Routes Entity
    // ==========================================
    // Represents a directed edge between two Locations, with the weights
    // (distance/time/cost) that route optimization algorithms operate on.
    // Maps to the "routes" table.
    [Table("routes")]
    public class RouteSegment
    {
        // Auto-generated numeric primary key for the route segment
        [Key]
        [Column("route_id")]
        public int RouteId { get; set; }

        // FK reference to the origin Location
        [Required]
        [Column("source_location_id")]
        [StringLength(32)]
        public string SourceLocationId { get; set; } = string.Empty;

        // FK reference to the destination Location
        [Required]
        [Column("destination_location_id")]
        [StringLength(32)]
        public string DestinationLocationId { get; set; } = string.Empty;

        // Physical distance between source and destination, in kilometers
        [Column("distance_km", TypeName = "decimal(8, 2)")]
        public decimal DistanceKm { get; set; }

        // Estimated base travel time, in minutes (before traffic adjustment)
        [Column("travel_time_minutes")]
        public int TravelTimeMinutes { get; set; }

        // Base monetary cost of traveling this segment, in LKR
        [Column("travel_cost_lkr", TypeName = "decimal(8, 2)")]
        public decimal TravelCostLkr { get; set; }

        // Multiplier applied to time/cost to account for traffic conditions (1.00 = no effect)
        [Column("traffic_multiplier", TypeName = "decimal(4, 2)")]
        public decimal TrafficMultiplier { get; set; } = 1.00m;

        // Whether this route segment is currently unusable (e.g. road closure);
        // route algorithms should skip blocked segments
        [Column("is_blocked")]
        public bool IsBlocked { get; set; } = false;
    }

    // ==========================================
    // 3. Vehicles Entity
    // ==========================================
    // Represents a delivery vehicle available for order allocation.
    // Maps to the "vehicles" table.
    [Table("vehicles")]
    public class Vehicle
    {
        // Primary key - human-readable vehicle code
        [Key]
        [Column("vehicle_id")]
        [StringLength(32)]
        public string VehicleId { get; set; } = string.Empty;

        // Display name/label of the vehicle
        [Required]
        [Column("name")]
        [StringLength(128)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [Column("type")]
        [StringLength(32)]
        public string Type { get; set; } = string.Empty; // Van, Truck, Electric_Cargo_Bike, Heavy_Lorry

        // Maximum weight this vehicle can carry, in kilograms
        [Column("capacity_kg", TypeName = "decimal(10, 2)")]
        public decimal CapacityKg { get; set; }

        // Maximum cargo volume this vehicle can carry, in cubic meters
        [Column("volume_m3", TypeName = "decimal(8, 2)")]
        public decimal VolumeM3 { get; set; }

        // Operating cost per kilometer traveled, used in cost-based route optimization
        [Column("cost_per_km", TypeName = "decimal(6, 2)")]
        public decimal CostPerKm { get; set; }

        // Average travel speed, in km/h, used to estimate delivery times
        [Column("avg_speed_kmh")]
        public int AvgSpeedKmh { get; set; }

        // FK reference to the Location where this vehicle is currently based/parked
        [Column("current_location_id")]
        [StringLength(32)]
        public string CurrentLocationId { get; set; } = string.Empty;

        // Current availability state of the vehicle
        [Column("status")]
        [StringLength(32)]
        public string Status { get; set; } = "available";
    }

    // ==========================================
    // 4. Drivers Entity
    // ==========================================
    // Represents a driver who can be assigned to a Vehicle for deliveries.
    // Maps to the "drivers" table.
    [Table("drivers")]
    public class Driver
    {
        // Primary key - human-readable driver code
        [Key]
        [Column("driver_id")]
        [StringLength(32)]
        public string DriverId { get; set; } = string.Empty;

        // Driver's full name
        [Required]
        [Column("name")]
        [StringLength(128)]
        public string Name { get; set; } = string.Empty;

        // Years of driving experience, used as a factor in allocation scoring
        [Column("experience_years")]
        public int ExperienceYears { get; set; }

        // Performance rating out of 5, used as a factor in allocation scoring
        [Column("rating", TypeName = "decimal(3, 2)")]
        public decimal Rating { get; set; }

        // Maximum hours this driver is allowed to work in a single shift
        [Column("max_shift_hours")]
        public int MaxShiftHours { get; set; } = 8;

        // Hours already worked today, used to check remaining shift capacity
        [Column("hours_worked_today", TypeName = "decimal(4, 2)")]
        public decimal HoursWorkedToday { get; set; } = 0.00m;

        // Hourly pay rate, used in cost calculations for allocation
        [Column("cost_per_hour", TypeName = "decimal(6, 2)")]
        public decimal CostPerHour { get; set; }

        // FK reference to the Vehicle currently assigned to this driver, if any
        [Column("assigned_vehicle_id")]
        [StringLength(32)]
        public string? AssignedVehicleId { get; set; }

        // Current availability state of the driver
        [Column("status")]
        [StringLength(32)]
        public string Status { get; set; } = "available";
    }

    // ==========================================
    // 5. Orders Entity
    // ==========================================
    // Represents a single customer delivery order to be routed, prioritized,
    // and allocated to a vehicle/driver. Maps to the "orders" table.
    [Table("orders")]
    public class Order
    {
        // Primary key - human-readable order code
        [Key]
        [Column("order_id")]
        [StringLength(32)]
        public string OrderId { get; set; } = string.Empty;

        // Customer-facing tracking reference number
        [Required]
        [Column("tracking_number")]
        [StringLength(64)]
        public string TrackingNumber { get; set; } = string.Empty;

        // Name of the customer placing the order
        [Required]
        [Column("customer_name")]
        [StringLength(128)]
        public string CustomerName { get; set; } = string.Empty;

        // FK reference to the Location where the order is picked up from
        [Required]
        [Column("pickup_location_id")]
        [StringLength(32)]
        public string PickupLocationId { get; set; } = string.Empty;

        // FK reference to the Location the order should be delivered to
        [Required]
        [Column("destination_location_id")]
        [StringLength(32)]
        public string DestinationLocationId { get; set; } = string.Empty;

        // Total weight of the order, in kilograms - used for vehicle capacity checks
        [Column("weight_kg", TypeName = "decimal(8, 2)")]
        public decimal WeightKg { get; set; }

        // Total volume of the order, in cubic meters - used for vehicle capacity checks
        [Column("volume_m3", TypeName = "decimal(6, 2)")]
        public decimal VolumeM3 { get; set; }

        // Delivery deadline expressed as hours from order creation (e.g. 2, 4, 8, 24);
        // a key input to the urgency/priority scoring in the decision support module
        [Column("deadline_hours", TypeName = "decimal(4, 2)")]
        public decimal DeadlineHours { get; set; }

        // Customer's service tier, used to weight priority in allocation/decision scoring
        [Column("customer_tier")]
        [StringLength(32)]
        public string CustomerTier { get; set; } = "Standard";

        // Declared monetary value of the order's contents, in LKR
        [Column("item_value_lkr", TypeName = "decimal(10, 2)")]
        public decimal ItemValueLkr { get; set; }

        // Whether the order contains perishable goods (affects urgency/handling)
        [Column("is_perishable")]
        public bool IsPerishable { get; set; } = false;

        // Handling sensitivity level of the order's contents
        [Column("fragility")]
        [StringLength(32)]
        public string Fragility { get; set; } = "Low";

        // FK reference to the Driver assigned to fulfill this order, if allocated
        [Column("assigned_driver_id")]
        [StringLength(32)]
        public string? AssignedDriverId { get; set; }

        // FK reference to the Vehicle assigned to fulfill this order, if allocated
        [Column("assigned_vehicle_id")]
        [StringLength(32)]
        public string? AssignedVehicleId { get; set; }

        // Current lifecycle state of the order
        [Column("status")]
        [StringLength(32)]
        public string Status { get; set; } = "pending";
    }

    // ==========================================
    // 6. Inventory Entity
    // ==========================================
    // Represents a stock item held at a specific warehouse Location.
    // Maps to the "inventory" table.
    [Table("inventory")]
    public class InventoryItem
    {
        // Primary key - human-readable inventory record code
        [Key]
        [Column("inventory_id")]
        [StringLength(32)]
        public string InventoryId { get; set; } = string.Empty;

        // FK reference to the warehouse Location holding this
