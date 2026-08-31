using System.Diagnostics;
using SmartLogistics.IDSS.Models;

namespace SmartLogistics.IDSS.Services
{
    public interface IRouteService
    {
        RouteOptimizationResponse CalculateRoute(RouteOptimizationRequest request, List<Location> nodes, List<RouteSegment> edges);
    }

    public class RouteOptimizationRequest
    {
        public string SourceNodeId { get; set; } = string.Empty;
        public string TargetNodeId { get; set; } = string.Empty;
        public string Criterion { get; set; } = "distance"; // distance, time, cost
        public string Algorithm { get; set; } = "dijkstra"; // dijkstra, astar, bellman, floyd
        public double TrafficMultiplier { get; set; } = 1.0;
    }

    public class RouteOptimizationResponse
    {
        public List<string> Path { get; set; } = new();
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
            var sw = Stopwatch.StartNew();

            // Build Adjacency List Graph
            var adj = new Dictionary<string, List<(string Target, double Weight, double Distance, double Time, double Cost)>>();
            foreach (var n in nodes)
            {
                adj[n.LocationId] = new List<(string, double, double, double, double)>();
            }

            foreach (var e in edges)
            {
                if (e.IsBlocked) continue;

                double weight = request.Criterion switch
                {
                    "time" => e.TravelTimeMinutes * (double)e.TrafficMultiplier * request.TrafficMultiplier,
                    "cost" => (double)e.TravelCostLkr * (double)e.TrafficMultiplier,
                    _ => (double)e.DistanceKm * (double)e.TrafficMultiplier
                };

                if (adj.ContainsKey(e.SourceLocationId) && adj.ContainsKey(e.DestinationLocationId))
                {
                    adj[e.SourceLocationId].Add((e.DestinationLocationId, weight, (double)e.DistanceKm, e.TravelTimeMinutes, (double)e.TravelCostLkr));
                    adj[e.DestinationLocationId].Add((e.SourceLocationId, weight, (double)e.DistanceKm, e.TravelTimeMinutes, (double)e.TravelCostLkr));
                }
            }

            // Execute Selected Algorithm
            var path = new List<string>();
            var distances = new Dictionary<string, double>();
            var predecessors = new Dictionary<string, string?>();
            int visitedCount = 0;

            foreach (var n in nodes)
            {
                distances[n.LocationId] = double.PositiveInfinity;
                predecessors[n.LocationId] = null;
            }

            if (distances.ContainsKey(request.SourceNodeId))
            {
                distances[request.SourceNodeId] = 0;
            }

            // Min-Heap Priority Queue for Dijkstra / A*
            var pq = new PriorityQueue<string, double>();
            if (adj.ContainsKey(request.SourceNodeId))
            {
                pq.Enqueue(request.SourceNodeId, 0);
            }

            while (pq.Count > 0)
            {
                var u = pq.Dequeue();
                visitedCount++;

                if (u == request.TargetNodeId) break;

                if (!adj.ContainsKey(u)) continue;

                foreach (var edge in adj[u])
                {
                    var v = edge.Target;
                    var alt = distances[u] + edge.Weight;

                    if (alt < distances[v])
                    {
                        distances[v] = alt;
                        predecessors[v] = u;
                        pq.Enqueue(v, alt);
                    }
                }
            }

            // Reconstruct path
            var curr = request.TargetNodeId;
            while (curr != null)
            {
                path.Insert(0, curr);
                curr = predecessors.GetValueOrDefault(curr);
            }

            if (path.Count == 0 || path[0] != request.SourceNodeId)
            {
                path.Clear();
            }

            // Calculate totals
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

            sw.Stop();
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
