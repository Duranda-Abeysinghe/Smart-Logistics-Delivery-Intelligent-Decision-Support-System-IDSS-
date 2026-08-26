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
            }
        }

    }

}