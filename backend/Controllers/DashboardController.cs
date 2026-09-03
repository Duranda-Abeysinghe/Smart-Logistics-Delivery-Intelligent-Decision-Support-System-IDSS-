using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartLogistics.IDSS.Data;

namespace SmartLogistics.IDSS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("kpis")]
        public async Task<IActionResult> GetDashboardKpis()
        {
            var totalLocations = await _context.Locations.CountAsync();
            var totalVehicles = await _context.Vehicles.CountAsync();
            var availableVehicles = await _context.Vehicles.CountAsync(v => v.Status == "available");
            var totalDrivers = await _context.Drivers.CountAsync();
            var totalOrders = await _context.Orders.CountAsync();
            var pendingOrders = await _context.Orders.CountAsync(o => o.Status == "pending");
            var totalInventoryValue = await _context.Inventory.SumAsync(i => (double)i.UnitValueLkr * i.Quantity);

            return Ok(new
            {
                totalLocations,
                totalVehicles,
                availableVehicles,
                totalDrivers,
                totalOrders,
                pendingOrders,
                totalInventoryValue,
                networkStatus = "OPERATIONAL_STABLE",
                systemHealthScore = 98.4,
                timestamp = DateTime.UtcNow
            });
        }

        // =====================================================================
        // Full network/fleet/order snapshot from MySQL, shaped to match the
        // frontend's LogisticsNode / LogisticsEdge / Vehicle / Driver /
        // DeliveryOrder / InventoryItem types exactly (camelCase field names).
        // Replaces the previously hardcoded src/data/defaultData.ts constants.
        // =====================================================================
        [HttpGet("network-data")]
        public async Task<IActionResult> GetNetworkData()
        {
            var locations = await _context.Locations.ToListAsync();
            var routes = await _context.Routes.ToListAsync();
            var vehicles = await _context.Vehicles.ToListAsync();
            var drivers = await _context.Drivers.ToListAsync();
            var orders = await _context.Orders.ToListAsync();
            var inventory = await _context.Inventory.ToListAsync();

            var nodes = locations.Select(l => new
            {
                id = l.LocationId,
                name = l.Name,
                type = l.Type,
                x = l.CoordX,
                y = l.CoordY,
                demand = l.Demand,
                capacity = l.Capacity,
                inventoryCount = l.InventoryCount,
                latitude = l.Latitude,
                longitude = l.Longitude
            });

            var edges = routes.Select(r => new
            {
                source = r.SourceLocationId,
                target = r.DestinationLocationId,
                distance = r.DistanceKm,
                travelTime = r.TravelTimeMinutes,
                cost = r.TravelCostLkr,
                trafficMultiplier = r.TrafficMultiplier,
                isBlocked = r.IsBlocked
            });

            var vehiclesDto = vehicles.Select(v => new
            {
                id = v.VehicleId,
                name = v.Name,
                type = v.Type,
                capacityKg = v.CapacityKg,
                volumeM3 = v.VolumeM3,
                costPerKm = v.CostPerKm,
                avgSpeedKmh = v.AvgSpeedKmh,
                currentLocationId = v.CurrentLocationId,
                status = v.Status
            });

            var driversDto = drivers.Select(d => new
            {
                id = d.DriverId,
                name = d.Name,
                experienceYears = d.ExperienceYears,
                rating = d.Rating,
                maxShiftHours = d.MaxShiftHours,
                hoursWorkedToday = d.HoursWorkedToday,
                costPerHour = d.CostPerHour,
                assignedVehicleId = d.AssignedVehicleId,
                status = d.Status
            });

            var ordersDto = orders.Select(o => new
            {
                id = o.OrderId,
                trackingNumber = o.TrackingNumber,
                customerName = o.CustomerName,
                pickupNodeId = o.PickupLocationId,
                destinationNodeId = o.DestinationLocationId,
                weightKg = o.WeightKg,
                volumeM3 = o.VolumeM3,
                deadlineHours = o.DeadlineHours,
                customerTier = o.CustomerTier,
                itemValue = o.ItemValueLkr,
                isPerishable = o.IsPerishable,
                fragility = o.Fragility,
                assignedDriverId = o.AssignedDriverId,
                assignedVehicleId = o.AssignedVehicleId,
                status = o.Status
            });

            var inventoryDto = inventory.Select(i => new
            {
                id = i.InventoryId,
                warehouseId = i.WarehouseId,
                productName = i.ProductName,
                sku = i.Sku,
                category = i.Category,
                quantity = i.Quantity,
                reorderLevel = i.ReorderLevel,
                unitValue = i.UnitValueLkr,
                weightPerUnitKg = i.WeightPerUnitKg
            });

            return Ok(new
            {
                nodes,
                edges,
                vehicles = vehiclesDto,
                drivers = driversDto,
                orders = ordersDto,
                inventory = inventoryDto
            });
        }
    }
}
