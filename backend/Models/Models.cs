using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartLogistics.IDSS.Models
{
    // ==========================================
    // 1. Locations Entity & DTOs
    // ==========================================
    [Table("locations")]
    public class Location
    {
        [Key]
        [Column("location_id")]
        [StringLength(32)]
        public string LocationId { get; set; } = string.Empty;

        [Required]
        [Column("name")]
        [StringLength(128)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [Column("type")]
        [StringLength(32)]
        public string Type { get; set; } = string.Empty; // warehouse, distribution_center, retail_hub, customer, port

        [Column("coord_x")]
        public int CoordX { get; set; }

        [Column("coord_y")]
        public int CoordY { get; set; }

        [Column("latitude", TypeName = "decimal(10, 7)")]
        public decimal? Latitude { get; set; }

        [Column("longitude", TypeName = "decimal(10, 7)")]
        public decimal? Longitude { get; set; }

        [Column("capacity")]
        public int? Capacity { get; set; }

        [Column("inventory_count")]
        public int? InventoryCount { get; set; }

        [Column("demand")]
        public int? Demand { get; set; }
    }

    // ==========================================
    // 2. Routes Entity
    // ==========================================
    [Table("routes")]
    public class RouteSegment
    {
        [Key]
        [Column("route_id")]
        public int RouteId { get; set; }

        [Required]
        [Column("source_location_id")]
        [StringLength(32)]
        public string SourceLocationId { get; set; } = string.Empty;

        [Required]
        [Column("destination_location_id")]
        [StringLength(32)]
        public string DestinationLocationId { get; set; } = string.Empty;

        [Column("distance_km", TypeName = "decimal(8, 2)")]
        public decimal DistanceKm { get; set; }

        [Column("travel_time_minutes")]
        public int TravelTimeMinutes { get; set; }

        [Column("travel_cost_lkr", TypeName = "decimal(8, 2)")]
        public decimal TravelCostLkr { get; set; }

        [Column("traffic_multiplier", TypeName = "decimal(4, 2)")]
        public decimal TrafficMultiplier { get; set; } = 1.00m;

        [Column("is_blocked")]
        public bool IsBlocked { get; set; } = false;
    }

    // ==========================================
    // 3. Vehicles Entity
    // ==========================================
    [Table("vehicles")]
    public class Vehicle
    {
        [Key]
        [Column("vehicle_id")]
        [StringLength(32)]
        public string VehicleId { get; set; } = string.Empty;

        [Required]
        [Column("name")]
        [StringLength(128)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [Column("type")]
        [StringLength(32)]
        public string Type { get; set; } = string.Empty; // Van, Truck, Electric_Cargo_Bike, Heavy_Lorry

        [Column("capacity_kg", TypeName = "decimal(10, 2)")]
        public decimal CapacityKg { get; set; }

        [Column("volume_m3", TypeName = "decimal(8, 2)")]
        public decimal VolumeM3 { get; set; }

        [Column("cost_per_km", TypeName = "decimal(6, 2)")]
        public decimal CostPerKm { get; set; }

        [Column("avg_speed_kmh")]
        public int AvgSpeedKmh { get; set; }

        [Column("current_location_id")]
        [StringLength(32)]
        public string CurrentLocationId { get; set; } = string.Empty;

        [Column("status")]
        [StringLength(32)]
        public string Status { get; set; } = "available";
    }

    // ==========================================
    // 4. Drivers Entity
    // ==========================================
    [Table("drivers")]
    public class Driver
    {
        [Key]
        [Column("driver_id")]
        [StringLength(32)]
        public string DriverId { get; set; } = string.Empty;

        [Required]
        [Column("name")]
        [StringLength(128)]
        public string Name { get; set; } = string.Empty;

        [Column("experience_years")]
        public int ExperienceYears { get; set; }

        [Column("rating", TypeName = "decimal(3, 2)")]
        public decimal Rating { get; set; }

        [Column("max_shift_hours")]
        public int MaxShiftHours { get; set; } = 8;

        [Column("hours_worked_today", TypeName = "decimal(4, 2)")]
        public decimal HoursWorkedToday { get; set; } = 0.00m;

        [Column("cost_per_hour", TypeName = "decimal(6, 2)")]
        public decimal CostPerHour { get; set; }

        [Column("assigned_vehicle_id")]
        [StringLength(32)]
        public string? AssignedVehicleId { get; set; }

        [Column("status")]
        [StringLength(32)]
        public string Status { get; set; } = "available";
    }

    // ==========================================
    // 5. Orders Entity
    // ==========================================
    [Table("orders")]
    public class Order
    {
        [Key]
        [Column("order_id")]
        [StringLength(32)]
        public string OrderId { get; set; } = string.Empty;

        [Required]
        [Column("tracking_number")]
        [StringLength(64)]
        public string TrackingNumber { get; set; } = string.Empty;

        [Required]
        [Column("customer_name")]
        [StringLength(128)]
        public string CustomerName { get; set; } = string.Empty;

        [Required]
        [Column("pickup_location_id")]
        [StringLength(32)]
        public string PickupLocationId { get; set; } = string.Empty;

        [Required]
        [Column("destination_location_id")]
        [StringLength(32)]
        public string DestinationLocationId { get; set; } = string.Empty;

        [Column("weight_kg", TypeName = "decimal(8, 2)")]
        public decimal WeightKg { get; set; }

        [Column("volume_m3", TypeName = "decimal(6, 2)")]
        public decimal VolumeM3 { get; set; }

        [Column("deadline_hours", TypeName = "decimal(4, 2)")]
        public decimal DeadlineHours { get; set; }

        [Column("customer_tier")]
        [StringLength(32)]
        public string CustomerTier { get; set; } = "Standard";

        [Column("item_value_lkr", TypeName = "decimal(10, 2)")]
        public decimal ItemValueLkr { get; set; }

        [Column("is_perishable")]
        public bool IsPerishable { get; set; } = false;

        [Column("fragility")]
        [StringLength(32)]
        public string Fragility { get; set; } = "Low";

        [Column("assigned_driver_id")]
        [StringLength(32)]
        public string? AssignedDriverId { get; set; }

        [Column("assigned_vehicle_id")]
        [StringLength(32)]
        public string? AssignedVehicleId { get; set; }

        [Column("status")]
        [StringLength(32)]
        public string Status { get; set; } = "pending";
    }

    // ==========================================
    // 6. Inventory Entity
    // ==========================================
    [Table("inventory")]
    public class InventoryItem
    {
        [Key]
        [Column("inventory_id")]
        [StringLength(32)]
        public string InventoryId { get; set; } = string.Empty;

        [Required]
        [Column("warehouse_id")]
        [StringLength(32)]
        public string WarehouseId { get; set; } = string.Empty;

        [Required]
        [Column("product_name")]
        [StringLength(128)]
        public string ProductName { get; set; } = string.Empty;

        [Required]
        [Column("sku")]
        [StringLength(64)]
        public string Sku { get; set; } = string.Empty;

        [Column("category")]
        [StringLength(64)]
        public string Category { get; set; } = string.Empty;

        [Column("quantity")]
        public int Quantity { get; set; }

        [Column("reorder_level")]
        public int ReorderLevel { get; set; }

        [Column("unit_value_lkr", TypeName = "decimal(8, 2)")]
        public decimal UnitValueLkr { get; set; }

        [Column("weight_per_unit_kg", TypeName = "decimal(6, 2)")]
        public decimal WeightPerUnitKg { get; set; }
    }
}
