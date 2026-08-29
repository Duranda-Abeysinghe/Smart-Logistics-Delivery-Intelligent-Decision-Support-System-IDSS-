import { LogisticsNode, LogisticsEdge } from '../types';

export class Graph {
  private nodes: Map<string, LogisticsNode> = new Map();
  private adjacencyList: Map<string, LogisticsEdge[]> = new Map();

  constructor() {}

  public addNode(node: LogisticsNode): void {
    this.nodes.set(node.id, node);
    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, []);
    }
  }

  public addEdge(edge: LogisticsEdge, undirected: boolean = true): void {
    if (!this.nodes.has(edge.source) || !this.nodes.has(edge.target)) {
      return;
    }

    const sourceEdges = this.adjacencyList.get(edge.source) || [];
    // remove duplicate if existing
    const filteredSource = sourceEdges.filter(e => e.target !== edge.target);
    filteredSource.push(edge);
    this.adjacencyList.set(edge.source, filteredSource);

    if (undirected) {
      const targetEdges = this.adjacencyList.get(edge.target) || [];
      const filteredTarget = targetEdges.filter(e => e.target !== edge.source);
      filteredTarget.push({
        source: edge.target,
        target: edge.source,
        distance: edge.distance,
        travelTime: edge.travelTime,
        cost: edge.cost,
        trafficMultiplier: edge.trafficMultiplier,
        isBlocked: edge.isBlocked
      });
      this.adjacencyList.set(edge.target, filteredTarget);
    }
  }

  public getNode(id: string): LogisticsNode | undefined {
    return this.nodes.get(id);
  }

  public getAllNodes(): LogisticsNode[] {
    return Array.from(this.nodes.values());
  }

  public getAllNodeIds(): string[] {
    return Array.from(this.nodes.keys());
  }

  public getNeighbors(nodeId: string): LogisticsEdge[] {
    return this.adjacencyList.get(nodeId) || [];
  }

  public getAllEdges(): LogisticsEdge[] {
    const edges: LogisticsEdge[] = [];
    const seen = new Set<string>();

    for (const [source, edgeList] of this.adjacencyList.entries()) {
      for (const edge of edgeList) {
        const key = [source, edge.target].sort().join('->');
        if (!seen.has(key)) {
          seen.add(key);
          edges.push(edge);
        }
      }
    }
    return edges;
  }

  public getEdge(source: string, target: string): LogisticsEdge | undefined {
    const edges = this.adjacencyList.get(source) || [];
    return edges.find(e => e.target === target);
  }

  public getDegree(nodeId: string): number {
    return (this.adjacencyList.get(nodeId) || []).length;
  }

  public getAdjacencyMatrix(): { matrix: number[][]; idMap: Map<string, number>; reverseMap: string[] } {
    const nodeIds = this.getAllNodeIds();
    const idMap = new Map<string, number>();
    const reverseMap: string[] = [];
    const n = nodeIds.length;

    nodeIds.forEach((id, index) => {
      idMap.set(id, index);
      reverseMap.push(id);
    });

    const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(Infinity));

    for (let i = 0; i < n; i++) {
      matrix[i][i] = 0;
    }

    for (const [source, edges] of this.adjacencyList.entries()) {
      const u = idMap.get(source);
      if (u === undefined) continue;

      for (const edge of edges) {
        const v = idMap.get(edge.target);
        if (v !== undefined) {
          const effectiveDistance = edge.isBlocked ? Infinity : edge.distance * (edge.trafficMultiplier || 1);
          matrix[u][v] = Math.min(matrix[u][v], effectiveDistance);
        }
      }
    }

    return { matrix, idMap, reverseMap };
  }

  public clone(): Graph {
    const newGraph = new Graph();
    for (const node of this.nodes.values()) {
      newGraph.addNode({ ...node });
    }
    for (const edge of this.getAllEdges()) {
      newGraph.addEdge({ ...edge }, true);
    }
    return newGraph;
  }
}
