using System.Diagnostics;
using SmartLogistics.IDSS.Models;

namespace SmartLogistics.IDSS.Services
{
    public interface IOptimizationService
    {
        TourOptimizationResponse OptimizeDeliveryTour(List<Location> waypoints, string algorithm, int iterations);
    }

    public class TourIterationStep
    {
        public int Iteration { get; set; }
        public double BestDistanceKm { get; set; }
        public double CurrentDistanceKm { get; set; }
        public double Temperature { get; set; }
    }

    public class TourOptimizationResponse
    {
        public List<string> OptimizedTourNodeIds { get; set; } = new();
        public double TotalTourDistanceKm { get; set; }
        public double TotalTourCostLkr { get; set; }
        public double EstimatedFuelSavingsLiters { get; set; }
        public List<TourIterationStep> IterationHistory { get; set; } = new();
        public long ExecutionTimeUs { get; set; }
        public double ExecutionTimeMs { get; set; }
        public string AlgorithmUsed { get; set; } = string.Empty;
        public string TimeComplexity { get; set; } = string.Empty;
        public string SpaceComplexity { get; set; } = string.Empty;
    }

    public class OptimizationService : IOptimizationService
    {
        public TourOptimizationResponse OptimizeDeliveryTour(
            List<Location> waypoints, 
            string algorithm, 
            int iterations = 1000)
        {
            var sw = Stopwatch.StartNew();
            int n = waypoints.Count;

            if (n <= 1)
            {
                return new TourOptimizationResponse
                {
                    OptimizedTourNodeIds = waypoints.Select(w => w.LocationId).ToList(),
                    TotalTourDistanceKm = 0,
                    TotalTourCostLkr = 0
                };
            }

            // Distance Matrix calculation
            double[,] dist = new double[n, n];
            for (int i = 0; i < n; i++)
            {
                for (int j = 0; j < n; j++)
                {
                    double dx = waypoints[i].CoordX - waypoints[j].CoordX;
                    double dy = waypoints[i].CoordY - waypoints[j].CoordY;
                    dist[i, j] = Math.Sqrt(dx * dx + dy * dy) * 0.18; // scaled km
                }
            }

            double CalculateTourDistance(List<int> tour)
            {
                double d = 0;
                for (int i = 0; i < tour.Count - 1; i++)
                {
                    d += dist[tour[i], tour[i + 1]];
                }
                d += dist[tour[^1], tour[0]];
                return d;
            }

            var history = new List<TourIterationStep>();
            List<int> bestTour;
            double bestDist;
            string algoKey = algorithm.ToLowerInvariant();
            string algorithmUsed;
            string timeComplexity;
            string spaceComplexity;

            if (algoKey == "exact_dp" && n <= 14)
            {
                // Held-Karp Exact Dynamic Programming with Bitmask Memoization O(n^2 * 2^n)
                int numStates = 1 << n;
                double[,] memo = new double[numStates, n];
                int[,] parent = new int[numStates, n];

                for (int i = 0; i < numStates; i++)
                    for (int j = 0; j < n; j++)
                        memo[i, j] = -1.0;

                double SolveDP(int mask, int pos)
                {
                    if (mask == (1 << n) - 1) return dist[pos, 0];
                    if (memo[mask, pos] >= 0) return memo[mask, pos];

                    double minCost = double.PositiveInfinity;
                    int bestNext = -1;

                    for (int next = 0; next < n; next++)
                    {
                        if ((mask & (1 << next)) == 0)
                        {
                            double cost = dist[pos, next] + SolveDP(mask | (1 << next), next);
                            if (cost < minCost)
                            {
                                minCost = cost;
                                bestNext = next;
                            }
                        }
                    }

                    parent[mask, pos] = bestNext;
                    memo[mask, pos] = minCost;
                    return minCost;
                }

                bestDist = SolveDP(1, 0);
                bestTour = new List<int> { 0 };
                int currMask = 1, currPos = 0;
                for (int s = 0; s < n - 1; s++)
                {
                    int nxt = parent[currMask, currPos];
                    if (nxt == -1) break;
                    bestTour.Add(nxt);
                    currMask |= (1 << nxt);
                    currPos = nxt;
                }

                algorithmUsed = "Held-Karp Exact DP (Bitmask Memoization)";
                timeComplexity = "O(N^2 * 2^N)";
                spaceComplexity = "O(N * 2^N)";
            }
            else if (algoKey == "greedy")
            {
                // Greedy Nearest Neighbor Heuristic
                var visited = new bool[n];
                bestTour = new List<int> { 0 };
                visited[0] = true;
                int current = 0;

                while (bestTour.Count < n)
                {
                    int nearest = -1;
                    double minDist = double.PositiveInfinity;
                    for (int next = 0; next < n; next++)
                    {
                        if (!visited[next] && dist[current, next] < minDist)
                        {
                            minDist = dist[current, next];
                            nearest = next;
                        }
                    }
                    visited[nearest] = true;
                    bestTour.Add(nearest);
                    current = nearest;
                }

                bestDist = CalculateTourDistance(bestTour);

                algorithmUsed = "Greedy Nearest Neighbor Heuristic";
                timeComplexity = "O(N^2)";
                spaceComplexity = "O(N)";
            }
            else if (algoKey == "genetic")
            {
                // Genetic Algorithm: Order Crossover (OX1) + Swap Mutation + Tournament Selection
                var rand = new Random(42);
                int populationSize = 40;
                int generations = Math.Max(30, Math.Min(iterations, 200));
                double mutationRate = 0.15;

                var baseGenes = Enumerable.Range(1, n - 1).ToList();

                List<int> ShuffledChromosome()
                {
                    var arr = new List<int>(baseGenes);
                    for (int i = arr.Count - 1; i > 0; i--)
                    {
                        int j = rand.Next(i + 1);
                        (arr[i], arr[j]) = (arr[j], arr[i]);
                    }
                    return arr;
                }

                double ChromosomeDistance(List<int> chromosome)
                {
                    var full = new List<int> { 0 };
                    full.AddRange(chromosome);
                    return CalculateTourDistance(full);
                }

                List<int> OrderCrossover(List<int> parentA, List<int> parentB)
                {
                    int len = parentA.Count;
                    int start = rand.Next(len);
                    int end = rand.Next(len);
                    int lo = Math.Min(start, end), hi = Math.Max(start, end);

                    var child = new int?[len];
                    for (int i = lo; i <= hi; i++) child[i] = parentA[i];

                    var used = new HashSet<int>(child.Where(g => g.HasValue).Select(g => g!.Value));
                    int fillPos = 0;
                    foreach (var gene in parentB)
                    {
                        if (!used.Contains(gene))
                        {
                            while (child[fillPos].HasValue) fillPos++;
                            child[fillPos] = gene;
                            used.Add(gene);
                        }
                    }
                    return child.Select(g => g!.Value).ToList();
                }

                List<int> SwapMutate(List<int> chromosome)
                {
                    var mutated = new List<int>(chromosome);
                    if (rand.NextDouble() < mutationRate)
                    {
                        int i = rand.Next(mutated.Count);
                        int j = rand.Next(mutated.Count);
                        (mutated[i], mutated[j]) = (mutated[j], mutated[i]);
                    }
                    return mutated;
                }

                var population = Enumerable.Range(0, populationSize).Select(_ => ShuffledChromosome()).ToList();
                var bestChromosome = population[0];
                bestDist = double.PositiveInfinity;

                for (int gen = 0; gen < generations; gen++)
                {
                    var evaluated = population
                        .Select(c => (chromosome: c, dist: ChromosomeDistance(c)))
                        .OrderBy(e => e.dist)
                        .ToList();

                    if (evaluated[0].dist < bestDist)
                    {
                        bestDist = evaluated[0].dist;
                        bestChromosome = new List<int>(evaluated[0].chromosome);
                    }

                    int eliteCount = Math.Max(2, populationSize / 10);
                    var nextGen = evaluated.Take(eliteCount).Select(e => new List<int>(e.chromosome)).ToList();

                    while (nextGen.Count < populationSize)
                    {
                        var parentA = evaluated[rand.Next(evaluated.Count)].chromosome;
                        var parentB = evaluated[rand.Next(evaluated.Count)].chromosome;
                        nextGen.Add(SwapMutate(OrderCrossover(parentA, parentB)));
                    }
                    population = nextGen;

                    if (gen % Math.Max(1, generations / 20) == 0 || gen == generations - 1)
                    {
                        history.Add(new TourIterationStep
                        {
                            Iteration = gen + 1,
                            BestDistanceKm = Math.Round(bestDist, 2),
                            CurrentDistanceKm = Math.Round(evaluated[0].dist, 2),
                            Temperature = 0
                        });
                    }
                }

                bestTour = new List<int> { 0 };
                bestTour.AddRange(bestChromosome);

                algorithmUsed = "Genetic Algorithm (Order Crossover, Tournament Selection)";
                timeComplexity = "O(G * P * N)";
                spaceComplexity = "O(P * N)";
            }
            else
            {
                // Simulated Annealing with 2-Opt Neighborhood Operations
                var currentTour = Enumerable.Range(0, n).ToList();
                double currentDist = CalculateTourDistance(currentTour);
                bestTour = new List<int>(currentTour);
                bestDist = currentDist;

                double temp = 100.0;
                double coolingRate = 0.992;
                var rand = new Random(42);

                for (int iter = 0; iter < iterations; iter++)
                {
                    int i = rand.Next(1, n);
                    int k = rand.Next(1, n);
                    if (i > k) (i, k) = (k, i);

                    var neighbor = new List<int>(currentTour);
                    neighbor.Reverse(i, k - i + 1); // 2-Opt edge swap

                    double neighborDist = CalculateTourDistance(neighbor);
                    double delta = neighborDist - currentDist;

                    if (delta < 0 || Math.Exp(-delta / temp) > rand.NextDouble())
                    {
                        currentTour = neighbor;
                        currentDist = neighborDist;

                        if (currentDist < bestDist)
                        {
                            bestDist = currentDist;
                            bestTour = new List<int>(currentTour);
                        }
                    }

                    temp *= coolingRate;

                    if (iter % (iterations / 20) == 0 || iter == iterations - 1)
                    {
                        history.Add(new TourIterationStep
                        {
                            Iteration = iter + 1,
                            BestDistanceKm = Math.Round(bestDist, 2),
                            CurrentDistanceKm = Math.Round(currentDist, 2),
                            Temperature = Math.Round(temp, 2)
                        });
                    }
                }

                algorithmUsed = "Simulated Annealing Heuristic (2-Opt)";
                timeComplexity = "O(Iterations * N)";
                spaceComplexity = "O(N)";
            }

            var finalPathIds = bestTour.Select(idx => waypoints[idx].LocationId).ToList();
            finalPathIds.Add(waypoints[bestTour[0]].LocationId); // return to depot

            sw.Stop();
            long microseconds = (long)(sw.Elapsed.TotalMilliseconds * 1000);

            return new TourOptimizationResponse
            {
                OptimizedTourNodeIds = finalPathIds,
                TotalTourDistanceKm = Math.Round(bestDist, 2),
                TotalTourCostLkr = Math.Round(bestDist * 115, 2),
                EstimatedFuelSavingsLiters = Math.Round((bestDist * 0.28) * 0.22, 1),
                IterationHistory = history,
                ExecutionTimeUs = microseconds,
                ExecutionTimeMs = Math.Round(sw.Elapsed.TotalMilliseconds, 3),
                AlgorithmUsed = algorithmUsed,
                TimeComplexity = timeComplexity,
                SpaceComplexity = spaceComplexity
            };
        }
    }
}
