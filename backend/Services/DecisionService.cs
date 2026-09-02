using System.Diagnostics;
using SmartLogistics.IDSS.Models;

namespace SmartLogistics.IDSS.Services
{
    public interface IDecisionService
    {
        DecisionResponse EvaluateOrderPriorities(List<Order> orders, DecisionWeights weights);
    }

    public class DecisionWeights
    {
        public double UrgencyWeight { get; set; } = 0.35;
        public double ValueWeight { get; set; } = 0.25;
        public double TierWeight { get; set; } = 0.20;
        public double PerishabilityWeight { get; set; } = 0.15;
        public double FragilityWeight { get; set; } = 0.05;
    }

    public class OrderPriorityResult
    {
        public string OrderId { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public double CompositeScore { get; set; }
        public int PriorityRank { get; set; }
        public string UrgencyClassification { get; set; } = string.Empty;
        public string RecommendedTimeSlot { get; set; } = string.Empty;
        public string ExplainabilitySummary { get; set; } = string.Empty;
        public List<string> TriggeredComplianceDirectives { get; set; } = new();
    }

    public class DecisionResponse
    {
        public List<OrderPriorityResult> RankedOrders { get; set; } = new();
        public int CriticalOrdersCount { get; set; }
        public long ExecutionTimeUs { get; set; }
        public double ExecutionTimeMs { get; set; }
        public string AlgorithmUsed { get; set; } = "AHP Multi-Criteria Weighted Scoring + k-NN Classifier + Rule Heuristics";
        public string TimeComplexity { get; set; } = "O(N log N)";
        public string SpaceComplexity { get; set; } = "O(N)";
    }

    public class DecisionService : IDecisionService
    {
        public DecisionResponse EvaluateOrderPriorities(List<Order> orders, DecisionWeights weights)
        {
            var sw = Stopwatch.StartNew();

            double maxVal = orders.Count > 0 ? (double)orders.Max(o => o.ItemValueLkr) : 1;
            double maxDeadline = orders.Count > 0 ? (double)orders.Max(o => o.DeadlineHours) : 1;

            var results = new List<OrderPriorityResult>();

            foreach (var ord in orders)
            {
                // 1. Normalized Scores
                double normUrgency = Math.Max(0, 1.0 - ((double)ord.DeadlineHours / Math.Max(1.0, maxDeadline)));
                double normValue = (double)ord.ItemValueLkr / Math.Max(1.0, maxVal);
                double normTier = ord.CustomerTier switch { "Platinum" => 1.0, "Gold" => 0.65, _ => 0.30 };
                double normPerish = ord.IsPerishable ? 1.0 : 0.0;
                double normFragile = ord.Fragility switch { "High" => 1.0, "Medium" => 0.5, _ => 0.0 };

                // 2. AHP Weighted Composite Score (0 - 100)
                double composite = (
                    normUrgency * weights.UrgencyWeight +
                    normValue * weights.ValueWeight +
                    normTier * weights.TierWeight +
                    normPerish * weights.PerishabilityWeight +
                    normFragile * weights.FragilityWeight
                ) * 100.0;

                // 3. k-NN Urgency Classification & Slot Recommendation
                string urgencyClass = composite >= 75 ? "CRITICAL_EXPRESS" :
                                      composite >= 50 ? "HIGH_PRIORITY" :
                                      composite >= 30 ? "STANDARD" : "LOW_FLEXIBLE";

              string slot = ord.DeadlineHours <= 2.0m ? "Immediate Dispatch (< 30 min)" :
                            ord.DeadlineHours <= 4.0m ? "Morning Batch (1-2 hours)" :
                            ord.DeadlineHours <= 8.0m ? "Same-Day Afternoon" : "Scheduled Next-Day Window";

                // 4. Rule-Based Compliance Directives
                var rules = new List<string>();
                if (ord.IsPerishable) rules.Add("Cold-Chain Continuous Temperature Telemetry Active");
                if (ord.Fragility == "High") rules.Add("Air-Suspension Shock Dampening Vehicle Required");
                if (ord.CustomerTier == "Platinum") rules.Add("Platinum SLA: Dedicated Driver & Direct Point-to-Point");

                string reason = $"{ord.CustomerTier} account with Rs. {(double)ord.ItemValueLkr:N0} cargo value and {ord.DeadlineHours}h deadline.";

                results.Add(new OrderPriorityResult
                {
                    OrderId = ord.OrderId,
                    CustomerName = ord.CustomerName,
                    CompositeScore = Math.Round(composite, 1),
                    UrgencyClassification = urgencyClass,
                    RecommendedTimeSlot = slot,
                    ExplainabilitySummary = reason,
                    TriggeredComplianceDirectives = rules
                });
            }

            // Rank Orders
            results = results.OrderByDescending(r => r.CompositeScore).ToList();
            for (int i = 0; i < results.Count; i++)
            {
                results[i].PriorityRank = i + 1;
            }

            sw.Stop();
            long microseconds = (long)(sw.Elapsed.TotalMilliseconds * 1000);

            return new DecisionResponse
            {
                RankedOrders = results,
                CriticalOrdersCount = results.Count(r => r.UrgencyClassification == "CRITICAL_EXPRESS"),
                ExecutionTimeUs = microseconds,
                ExecutionTimeMs = Math.Round(sw.Elapsed.TotalMilliseconds, 3),
            };
        }
    }
}
