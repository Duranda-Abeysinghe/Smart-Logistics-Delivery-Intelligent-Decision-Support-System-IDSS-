using Microsoft.EntityFrameworkCore;
using SmartLogistics.IDSS.Models;

namespace SmartLogistics.IDSS.Data
{
    // EF Core database context for the Smart Logistics & Delivery IDSS.
    // Maps domain models (Location, Vehicle, Order, etc.) to database tables
    // and configures indexes used by the route optimization, allocation,
    // and decision support modules.
    public class AppDbContext : DbContext
    {
        // Standard EF Core constructor - options (connection string, provider, etc.)
        // are injected via dependency injection in Program.cs / Startup.cs
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // Nodes in the logistics network (warehouses, distribution centers, customers, etc.)
        public DbSet<Location> Locations { get; set; } = null!;

        // Edges connecting Locations - represents travel distance/cost/time between two points
        public DbSet<RouteSegment> Routes { get; set; } = null!;

        // Fleet of delivery vehicles available for allocation
        public DbSet<Vehicle> Vehicles { get; set; } = null!;

        // Drivers who can be assigned to vehicles
        public DbSet<Driver> Drivers { get; set; } = null!;

        // Customer delivery orders to be routed, prioritized, and allocated
        public DbSet<Order> Orders { get; set; } = null!;

        // Stock/inventory records tied to warehouse locations
        public DbSet<InventoryItem> Inventory { get; set; } = null!;

        // Configures entity relationships and database indexes
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Indexes for fast lookup

            // Speeds up queries that find all route segments starting from a given location
            // (e.g. building an adjacency list for route optimization algorithms)
            modelBuilder.Entity<RouteSegment>()
                .HasIndex(r => r.SourceLocationId);

            // Speeds up queries that find all route segments ending at a given location
            modelBuilder.Entity<RouteSegment>()
                .HasIndex(r => r.DestinationLocationId);

            // Composite index to speed up the decision/priority module's queries,
            // which frequently filter/sort orders by customer tier and deadline urgency together
            modelBuilder.Entity<Order>()
                .HasIndex(o => new { o.CustomerTier, o.DeadlineHours });

            // Speeds up SKU-based lookups when checking or updating inventory levels
            modelBuilder.Entity<InventoryItem>()
                .HasIndex(i => i.Sku);
        }
    }
}
