using System.Diagnostics;
using SmartLogistics.IDSS.Models;

namespace SmartLogistics.IDSS.Services
{
    public interface IAllocationService
    {
        AllocationResponse AllocateFleetResources(List<Order> orders, List<Vehicle> vehicles, List<Driver> drivers, string strategy);
    }

    public class VehicleAssignment
    {
        public Vehicle Vehicle { get; set; } = null!;
        public Driver? Driver { get; set; }
        public List<Order> AssignedOrders { get; set; } = new();
        public double TotalWeightKg { get; set; }
        public double TotalVolumeM3 { get; set; }
        public double TotalDeliveredValueLkr { get; set; }
        public double CapacityUtilizationPct { get; set; }
    }

    public class AllocationResponse
    {
        public List<VehicleAssignment> Assignments { get; set; } = new();
        public int TotalOrdersDelivered { get; set; }
        public double TotalFleetValueDelivered { get; set; }
        public double OverallCapacityUtilizationPct { get; set; }
        public long ExecutionTimeUs { get; set; }
        public double ExecutionTimeMs { get; set; }
        public string StrategyUsed { get; set; } = string.Empty;
        public string TimeComplexity { get; set; } = string.Empty;
        public string SpaceComplexity { get; set; } = string.Empty;
    }

    public class AllocationService : IAllocationService
    {
        public AllocationResponse AllocateFleetResources(
            List<Order> orders, 
            List<Vehicle> vehicles, 
            List<Driver> drivers, 
            string strategy)
        {
            // Measure how long the allocation algorithm takes to execute.
            var sw = Stopwatch.StartNew();

            // Filter resources so only currently available vehicles, drivers and pending orders are used.
            var availableVehicles = vehicles.Where(v => v.Status == "available").ToList();
            var availableDrivers = drivers.Where(d => d.Status == "available").OrderByDescending(d => d.Rating).ToList();
            var pendingOrders = orders.Where(o => o.Status == "pending").ToList();

            var assignments = new List<VehicleAssignment>();

            // Tracks which available driver should be assigned next.
            int driverIdx = 0;

            if (strategy.ToLowerInvariant() == "knapsack")
            {
                // Dynamic Programming / 0-1 Knapsack approach per vehicle
                var remainingOrders = new List<Order>(pendingOrders);

                foreach (var vehicle in availableVehicles)
                {
                    if (remainingOrders.Count == 0) break;

                    int cap = (int)vehicle.CapacityKg;
                    int n = remainingOrders.Count;

                    // Weight capacity is scaled down to reduce the size of the DP table.
                    int scale = 20; // scale step for DP table
                    int W = cap / scale;

                    // DP table stores the maximum order value achievable for each capacity.
                    double[,] dp = new double[n + 1, W + 1];

                    for (int i = 1; i <= n; i++)
                    {
                        var ord = remainingOrders[i - 1];
                        int wt = Math.Max(1, (int)ord.WeightKg / scale);
                        double val = (double)ord.ItemValueLkr;

                        for (int w = 0; w <= W; w++)
                        {
                            if (wt <= w)
                                dp[i, w] = Math.Max(dp[i - 1, w], dp[i - 1, w - wt] + val);
                            else
                                dp[i, w] = dp[i - 1, w];
                        }
                    }

                    // Backtrack
                    var chosen = new List<Order>();
                    int currW = W;

                    // Backtracking identifies which orders were included in the optimal solution.
                    for (int i = n; i > 0; i--)
                    {
                        if (dp[i, currW] != dp[i - 1, currW])
                        {
                            var ord = remainingOrders[i - 1];
                            chosen.Add(ord);
                            currW -= Math.Max(1, (int)ord.WeightKg / scale);
                        }
                    }

                    double totalWt = chosen.Sum(o => (double)o.WeightKg);
                    double totalVol = chosen.Sum(o => (double)o.VolumeM3);
                    double totalVal = chosen.Sum(o => (double)o.ItemValueLkr);

                    var assignment = new VehicleAssignment
                    {
                        Vehicle = vehicle,
                        Driver = driverIdx < availableDrivers.Count ? availableDrivers[driverIdx++] : null,
                        AssignedOrders = chosen,
                        TotalWeightKg = Math.Round(totalWt, 1),
                        TotalVolumeM3 = Math.Round(totalVol, 2),
                        TotalDeliveredValueLkr = Math.Round(totalVal, 2),
                        CapacityUtilizationPct = Math.Round((totalWt / (double)vehicle.CapacityKg) * 100, 1)
                    };
                    assignments.Add(assignment);

                    // Remove allocated orders so they cannot be assigned to another vehicle.
                    foreach (var c in chosen) remainingOrders.Remove(c);
                }
            }
            else
            {
                // Greedy Allocation: Sort orders by Value / Weight ratio and Deadline
                var sortedOrders = pendingOrders
                    .OrderByDescending(o => (double)o.ItemValueLkr / (double)Math.Max(1, o.WeightKg))
                    .ThenBy(o => (double)o.DeadlineHours)
                    .ToList();

                foreach (var vehicle in availableVehicles)
                {
                    var assigned = new List<Order>();
                    double currentWt = 0;
                    double currentVol = 0;

                    for (int i = sortedOrders.Count - 1; i >= 0; i--)
                    {
                        var ord = sortedOrders[i];

                        // Assign the order only if both weight and volume limits remain valid.
                        if (currentWt + (double)ord.WeightKg <= (double)vehicle.CapacityKg &&
                            currentVol + (double)ord.VolumeM3 <= (double)vehicle.VolumeM3)
                        {
                            assigned.Add(ord);
                            currentWt += (double)ord.WeightKg;
                            currentVol += (double)ord.VolumeM3;
                            sortedOrders.RemoveAt(i);
                        }
                    }

                    if (assigned.Count > 0)
                    {
                        assignments.Add(new VehicleAssignment
                        {
                            Vehicle = vehicle,
                            Driver = driverIdx < availableDrivers.Count ? availableDrivers[driverIdx++] : null,
                            AssignedOrders = assigned,
                            TotalWeightKg = Math.Round(currentWt, 1),
                            TotalVolumeM3 = Math.Round(currentVol, 2),
                            TotalDeliveredValueLkr = Math.Round(assigned.Sum(o => (double)o.ItemValueLkr), 2),
                            CapacityUtilizationPct = Math.Round((currentWt / (double)vehicle.CapacityKg) * 100, 1)
                        });
                    }
                }
            }

            sw.Stop();
            long microseconds = (long)(sw.Elapsed.TotalMilliseconds * 1000);

            // Calculate the average capacity usage across all assigned vehicles.
            double overallUtil = assignments.Count > 0 ? assignments.Average(a => a.CapacityUtilizationPct) : 0;

            return new AllocationResponse
            {
                Assignments = assignments,
                TotalOrdersDelivered = assignments.Sum(a => a.AssignedOrders.Count),
                TotalFleetValueDelivered = Math.Round(assignments.Sum(a => a.TotalDeliveredValueLkr), 2),
                OverallCapacityUtilizationPct = Math.Round(overallUtil, 1),
                ExecutionTimeUs = microseconds,
                ExecutionTimeMs = Math.Round(sw.Elapsed.TotalMilliseconds, 3),
                StrategyUsed = strategy.ToLowerInvariant() == "knapsack" ? "0/1 Knapsack Dynamic Programming" : "Greedy Priority Dispatch",
                TimeComplexity = strategy.ToLowerInvariant() == "knapsack" ? "O(Vehicles * Orders * Capacity)" : "O(Orders log Orders + Vehicles * Orders)",
                SpaceComplexity = strategy.ToLowerInvariant() == "knapsack" ? "O(Orders * Capacity)" : "O(Orders)"
            };
        }
    }
}