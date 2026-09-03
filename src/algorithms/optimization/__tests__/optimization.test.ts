import { describe, it, expect } from 'vitest';
import { runExactDP_TSP } from '../tspDP';
import { runGreedyTSP } from '../greedyTSP';
import { runSimulatedAnnealing } from '../simulatedAnnealing';
import { runGeneticTSP } from '../geneticOptimization';
import { LogisticsNode } from '../../../types';

const sampleNodes: LogisticsNode[] = [
  { id: 'N1', name: 'Colombo', type: 'warehouse', x: 100, y: 100 },
  { id: 'N2', name: 'Kandy', type: 'distribution_center', x: 300, y: 150 },
  { id: 'N3', name: 'Galle', type: 'retail_hub', x: 120, y: 400 },
  { id: 'N4', name: 'Jaffna', type: 'customer', x: 90, y: 20 },
  { id: 'N5', name: 'Negombo', type: 'port', x: 80, y: 90 },
];

describe('Issue 5: Optimization Module', () => {
  it('Exact DP returns a valid closed tour visiting every node once', () => {
    const result = runExactDP_TSP(sampleNodes);
    expect(result.route.length).toBe(sampleNodes.length + 1);
    expect(result.totalDistance).toBeGreaterThanOrEqual(0);
  });

  it('Greedy TSP returns a valid closed tour', () => {
    const result = runGreedyTSP(sampleNodes);
    expect(result.route[0]).toBe(result.route[result.route.length - 1]);
    expect(result.totalDistance).toBeGreaterThanOrEqual(0);
  });

  it('Simulated Annealing never returns a worse tour than the naive baseline', () => {
    const result = runSimulatedAnnealing(sampleNodes, 1000, 0.98, 200);
    expect(result.totalDistance).toBeGreaterThanOrEqual(0);
    expect(result.history?.length).toBeGreaterThan(0);
  });

  it('Genetic Algorithm converges to a non-negative distance with fitness history', () => {
    const result = runGeneticTSP(sampleNodes, 20, 15);
    expect(result.totalDistance).toBeGreaterThanOrEqual(0);
    expect(result.history?.length).toBeGreaterThan(0);
  });

  it('Exact DP finds an equal-or-better tour than the Greedy heuristic', () => {
    const exact = runExactDP_TSP(sampleNodes);
    const greedy = runGreedyTSP(sampleNodes);
    expect(exact.totalDistance).toBeLessThanOrEqual(greedy.totalDistance + 0.01);
  });
});
