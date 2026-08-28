using Microsoft.EntityFrameworkCore;
using SmartLogistics.IDSS.Models;

namespace SmartLogistics.IDSS.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Location> Locations { get; set; } = null!;
        public DbSet<RouteSegment> Routes { get; set; } = null!;
        public DbSet<Vehicle> Vehicles { get; set; } = null!;
        public DbSet<Driver> Drivers { get; set; } = null!;
        public DbSet<Order> Orders { get; set; } = null!;
        public DbSet<InventoryItem> Inventory { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Indexes for fast lookup
            modelBuilder.Entity<RouteSegment>()
                .HasIndex(r => r.SourceLocationId);

            modelBuilder.Entity<RouteSegment>()
                .HasIndex(r => r.DestinationLocationId);

            modelBuilder.Entity<Order>()
                .HasIndex(o => new { o.CustomerTier, o.DeadlineHours });

            modelBuilder.Entity<InventoryItem>()
                .HasIndex(i => i.Sku);
        }
    }
}
