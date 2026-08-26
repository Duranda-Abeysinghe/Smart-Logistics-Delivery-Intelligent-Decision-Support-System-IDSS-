using System.Diagnostics;
using SmartLogistics.IDSS.Models;

namespace SmartLogistics.IDSS.Services
{
    public interface INetworkService
    {
        NetworkAnalysisResponse AnalyzeNetworkTopology(List<Location> nodes, List<RouteSegment> edges);
    }

    public class NodeCentralityMetric
    {
        public string NodeId { get; set; } = string.Empty;
        public string NodeName { get; set; } = string.Empty;
        public string NodeType { get; set; } = string.Empty;
        public int Degree { get; set; }
        public double ClosenessCentrality { get; set; }
        public double BetweennessCentrality { get; set; }
        public int Rank { get; set; }
    }

    public class NetworkAnalysisResponse
    {
        public List<NodeCentralityMetric> Centralities { get; set; } = new();
        public List<string> BridgeEdges { get; set; } = new();
        public int ConnectedComponentsCount { get; set; }
        public double NetworkDensity { get; set; }
        public string MostCriticalBottleneckNodeId { get; set; } = string.Empty;
        public long ExecutionTimeUs { get; set; }
        public double ExecutionTimeMs { get; set; }
        public string TimeComplexity { get; set; } = string.Empty;
        public string SpaceComplexity { get; set; } = string.Empty;
    }

    public class NetworkService : INetworkService
    {
        public NetworkAnalysisResponse AnalyzeNetworkTopology(List<Location> nodes, List<RouteSegment> edges)
        {
            var sw = Stopwatch.StartNew();
            int n = nodes.Count;

            var adj = new Dictionary<string, List<string>>();
            foreach (var node in nodes) adj[node.LocationId] = new List<string>();

            foreach (var e in edges)
            {
                if (e.IsBlocked) continue;
                if (adj.ContainsKey(e.SourceLocationId) && adj.ContainsKey(e.DestinationLocationId))
                {
                    adj[e.SourceLocationId].Add(e.DestinationLocationId);
                    adj[e.DestinationLocationId].Add(e.SourceLocationId);
                }
            }

            // 1. Degree Centrality
            var degrees = nodes.ToDictionary(k => k.LocationId, v => adj[v.LocationId].Count);

            // 2. Brandes' Betweenness Centrality & Closeness Centrality
            var betweenness = nodes.ToDictionary(k => k.LocationId, v => 0.0);
            var closeness = nodes.ToDictionary(k => k.LocationId, v => 0.0);

            foreach (var s in nodes.Select(x => x.LocationId))
            {
                var stack = new Stack<string>();
                var pred = nodes.ToDictionary(k => k.LocationId, v => new List<string>());
                var sigma = nodes.ToDictionary(k => k.LocationId, v => 0.0);
                var dist = nodes.ToDictionary(k => k.LocationId, v => -1);
                var delta = nodes.ToDictionary(k => k.LocationId, v => 0.0);

                sigma[s] = 1.0;
                dist[s] = 0;

                var queue = new Queue<string>();
                queue.Enqueue(s);

                while (queue.Count > 0)
                {
                    var v = queue.Dequeue();
                    stack.Push(v);

                    foreach (var w in adj[v])
                    {
                        if (dist[w] < 0)
                        {
                            dist[w] = dist[v] + 1;
                            queue.Enqueue(w);
                        }

                        if (dist[w] == dist[v] + 1)
                        {
                            sigma[w] += sigma[v];
                            pred[w].Add(v);
                        }
                    }
                }

                // Closeness calculation
                double totalDist = dist.Values.Where(d => d > 0).Sum();
                int reachableCount = dist.Values.Count(d => d > 0);
                if (reachableCount > 0 && totalDist > 0)
                {
                    closeness[s] = Math.Round((double)reachableCount / totalDist, 4);
                }

                // Accumulate betweenness
                while (stack.Count > 0)
                {
                    var w = stack.Pop();
                    foreach (var v in pred[w])
                    {
                        delta[v] += (sigma[v] / sigma[w]) * (1.0 + delta[w]);
                    }
                    if (w != s)
                    {
                        betweenness[w] += delta[w];
                    }
                }
            }

            // Normalization
            double normFactor = (n > 2) ? 1.0 / ((n - 1) * (n - 2) / 2.0) : 1.0;
            var metricsList = nodes.Select(node => new NodeCentralityMetric
            {
                NodeId = node.LocationId,
                NodeName = node.Name,
                NodeType = node.Type,
                Degree = degrees[node.LocationId],
                ClosenessCentrality = closeness[node.LocationId],
                BetweennessCentrality = Math.Round((betweenness[node.LocationId] / 2.0) * normFactor, 4),
            })
            .OrderByDescending(m => m.BetweennessCentrality)
            .ToList();

            for (int i = 0; i < metricsList.Count; i++)
            {
                metricsList[i].Rank = i + 1;
            }

            // 3. Tarjan's Bridge Detection
            var bridges = new List<string>();
            var disc = new Dictionary<string, int>();
            var low = new Dictionary<string, int>();
            var parent = new Dictionary<string, string?>();
            int timer = 0;

            void BridgeDFS(string u)
            {
                timer++;
                disc[u] = timer;
                low[u] = timer;

                foreach (var v in adj[u])
                {
                    if (!disc.ContainsKey(v))
                    {
                        parent[v] = u;
                        BridgeDFS(v);
                        low[u] = Math.Min(low[u], low[v]);

                        if (low[v] > disc[u])
                        {
                            bridges.Add($"{u} <-> {v}");
                        }
                    }
                    else if (v != parent.GetValueOrDefault(u))
                    {
                        low[u] = Math.Min(low[u], disc[v]);
                    }
                }
            }

            foreach (var node in nodes)
            {
                if (!disc.ContainsKey(node.LocationId))
                {
                    BridgeDFS(node.LocationId);
                }
            }

            sw.Stop();
            long microseconds = (long)(sw.Elapsed.TotalMilliseconds * 1000);

            double maxPossibleEdges = n * (n - 1) / 2.0;
            double density = maxPossibleEdges > 0 ? edges.Count(e => !e.IsBlocked) / maxPossibleEdges : 0;

            return new NetworkAnalysisResponse
            {
                Centralities = metricsList,
                BridgeEdges = bridges,
                ConnectedComponentsCount = 1,
                NetworkDensity = Math.Round(density, 3),
                MostCriticalBottleneckNodeId = metricsList.FirstOrDefault()?.NodeId ?? "",
                ExecutionTimeUs = microseconds,
                ExecutionTimeMs = Math.Round(sw.Elapsed.TotalMilliseconds, 3),
                TimeComplexity = "O(V * E + V log V)",
                SpaceComplexity = "O(V + E)"
            };
        }
    }
}
