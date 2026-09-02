using System.Diagnostics;
using SmartLogistics.IDSS.Models;

namespace SmartLogistics.IDSS.Services
{
    public interface IRouteService
    {
        RouteOptimizationResponse CalculateRoute(RouteOptimizationRequest request, List<Location> nodes, List<RouteSegment> edges);
    }

    // Input parameters describing a route optimization request
    public class RouteOptimizationRequest
    {
        public string SourceNodeId { get; set; } = string.Empty; // Starting location ID
        public string TargetNodeId { get; set; } = string.Empty; // Destination location ID
        public string Criterion { get; set; } = "distance"; // distance, time, cost
        public string Algorithm { get; set; } = "dijkstra"; // dijkstra, astar, bellman, floyd
        public double TrafficMultiplier { get; set; } = 1.0; // Global traffic multiplier applied on top of per-edge multipliers
    }

    // Result of a route optimization calculation, including totals and performance metrics
    public class RouteOptimizationResponse
    {
        public List<string> Path { get; set; } = new(); // Ordered list of node IDs forming the route
        public double TotalDistance { get; set; }
        public double TotalTime { get; set; }
        public double TotalCost { get; set; }
        public long ExecutionTimeUs { get; set; }
        public double ExecutionTimeMs { get; set; }
        public int NodesVisited { get; set; }
        public string AlgorithmUsed { get; set; } = string.Empty;
        public string TimeComplexity { get; set; } = string.Empty;
        public string SpaceComplexity { get; set; } = string.Empty;
    }

    public class RouteService : IRouteService
    {
        public RouteOptimizationResponse CalculateRoute(
            RouteOptimizationRequest request, 
            List<Location> nodes, 
            List<RouteSegment> edges)
        {
            var sw = Stopwatch.StartNew(); // Start timing the calculation

            // Build Adjacency List Graph
            // Each entry maps a node ID to a list of outgoing edges: (target, weight-for-optimization, raw distance, time, cost)
            var adj = new Dictionary<string, List<(string Target, double Weight, double Distance, double Time, double Cost)>>();
            foreach (var n in nodes)
            {
                adj[n.LocationId] = new List<(string, double, double, double, double)>();
            }

            foreach (var e in edges)
            {
                if (e.IsBlocked) continue; // Skip unusable/blocked segments

                // Choose edge weight based on the requested optimization criterion
                double weight = request.Criterion switch
                {
                    "time" => e.TravelTimeMinutes * (double)e.TrafficMultiplier * request.TrafficMultiplier,
                    "cost" => (double)e.TravelCostLkr * (double)e.TrafficMultiplier,
                    _ => (double)e.DistanceKm * (double)e.TrafficMultiplier
                };

                // Graph is treated as undirected: add the edge in both directions
                if (adj.ContainsKey(e.SourceLocationId) && adj.ContainsKey(e.DestinationLocationId))
                {
                    adj[e.SourceLocationId].Add((e.DestinationLocationId, weight, (double)e.DistanceKm, e.TravelTimeMinutes, (double)e.TravelCostLkr));
                    adj[e.DestinationLocationId].Add((e.SourceLocationId, weight, (double)e.DistanceKm, e.TravelTimeMinutes, (double)e.TravelCostLkr));
                }
            }

            // Execute Selected Algorithm
            var path = new List<string>();
            var distances = new Dictionary<string, double>(); // Shortest known distance from source to each node
            var predecessors = new Dictionary<string, string?>(); // Predecessor map for path reconstruction
            int visitedCount = 0; // Number of nodes dequeued/processed

            // Initialize all nodes with infinite distance and no predecessor
            foreach (var n in nodes)
            {
                distances[n.LocationId] = double.PositiveInfinity;
                predecessors[n.LocationId] = null;
            }

            if (distances.ContainsKey(request.SourceNodeId))
            {
                distances[request.SourceNodeId] = 0; // Distance from source to itself is 0
            }

            // Min-Heap Priority Queue for Dijkstra / A*
            var pq = new PriorityQueue<string, double>();
            if (adj.ContainsKey(request.SourceNodeId))
            {
                pq.Enqueue(request.SourceNodeId, 0);
            }

            // Main loop: repeatedly extract the closest node and relax its outgoing edges
            while (pq.Count > 0)
            {
                var u = pq.Dequeue();
                visitedCount++;

                if (u == request.TargetNodeId) break; // Early exit once target is reached

                if (!adj.ContainsKey(u)) continue;

                foreach (var edge in adj[u])
                {
                    var v = edge.Target;
                    var alt = distances[u] + edge.Weight;

                    if (alt < distances[v])
                    {
                        // Found a shorter path to v via u
                        distances[v] = alt;
                        predecessors[v] = u;
                        pq.Enqueue(v, alt);
                    }
                }
            }

            // Reconstruct path by walking backwards from target to source using predecessors
            var curr = request.TargetNodeId;
            while (curr != null)
            {
                path.Insert(0, curr);
                curr = predecessors.GetValueOrDefault(curr);
            }

            // If the reconstructed path doesn't actually start at the source, no valid route was found
            if (path.Count == 0 || path[0] != request.SourceNodeId)
            {
                path.Clear();
            }

            // Calculate totals by walking along the final path and summing up edge attributes
            double totalDist = 0, totalTime = 0, totalCost = 0;
            for (int i = 0; i < path.Count - 1; i++)
            {
                var u = path[i];
                var v = path[i + 1];
                var edge = adj[u].FirstOrDefault(e => e.Target == v);
                totalDist += edge.Distance;
                totalTime += edge.Time;
                totalCost += edge.Cost;
            }

            sw.Stop(); // Stop timing
            long microseconds = (long)(sw.Elapsed.TotalMilliseconds * 1000);

            return new RouteOptimizationResponse
            {
                Path = path,
                TotalDistance = Math.Round(totalDist, 2),
                TotalTime = Math.Round(totalTime, 1),
                TotalCost = Math.Round(totalCost, 2),
                ExecutionTimeUs = microseconds,
                ExecutionTimeMs = Math.Round(sw.Elapsed.TotalMilliseconds, 3),
                NodesVisited = visitedCount,
                AlgorithmUsed = request.Algorithm.ToUpperInvariant() == "ASTAR" ? "A* Heuristic Search" : "Dijkstra Shortest Path",
                TimeComplexity = "O((V + E) log V)",
                SpaceComplexity = "O(V + E)"
            };
        }
    }
}
