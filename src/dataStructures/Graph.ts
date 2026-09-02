import { LogisticsNode, LogisticsEdge } from '../types';

// Graph data structure representing the logistics network.
// Uses an adjacency list internally, with nodes stored separately for O(1) lookup.
// Supports both directed and undirected edges, and is the core structure
// consumed by the route optimization algorithms (Dijkstra, A*, etc.) and
// the network analysis module (centrality calculations).
export class Graph {
  // Maps nodeId -> LogisticsNode, for fast direct node lookups
  private nodes: Map<string, LogisticsNode> = new Map();

  // Maps nodeId -> list of outgoing edges from that node
  private adjacencyList: Map<string, LogisticsEdge[]> = new Map();

  constructor() {}

  // Registers a node in the graph and ensures it has an (initially empty)
  // adjacency list entry so getNeighbors() never returns undefined for it
  public addNode(node: LogisticsNode): void {
    this.nodes.set(node.id, node);
    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, []);
    }
  }

  // Adds an edge between two existing nodes. By default also adds the
  // reverse edge (undirected), since most logistics routes are bidirectional.
  public addEdge(edge: LogisticsEdge, undirected: boolean = true): void {
    // Guard: don't allow edges referencing nodes that haven't been added yet
    if (!this.nodes.has(edge.source) || !this.nodes.has(edge.target)) {
      return;
    }

    const sourceEdges = this.adjacencyList.get(edge.source) || [];
    // remove duplicate if existing
    // (replacing rather than duplicating means re-adding an edge updates it in place)
    const filteredSource = sourceEdges.filter(e => e.target !== edge.target);
    filteredSource.push(edge);
    this.adjacencyList.set(edge.source, filteredSource);

    if (undirected) {
      // Mirror the edge in the opposite direction so traversal works both ways
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

  // Retrieves a single node by id
  public getNode(id: string): LogisticsNode | undefined {
    return this.nodes.get(id);
  }

  // Returns all nodes in the graph
  public getAllNodes(): LogisticsNode[] {
    return Array.from(this.nodes.values());
  }

  // Returns just the ids of all nodes (used to initialize algorithm state maps)
  public getAllNodeIds(): string[] {
    return Array.from(this.nodes.keys());
  }

  // Returns the outgoing edges (neighbors) for a given node
  public getNeighbors(nodeId: string): LogisticsEdge[] {
    return this.adjacencyList.get(nodeId) || [];
  }

  // Returns every unique edge in the graph exactly once,
  // even though undirected edges are stored twice internally (once per direction)
  public getAllEdges(): LogisticsEdge[] {
    const edges: LogisticsEdge[] = [];
    const seen = new Set<string>();
    for (const [source, edgeList] of this.adjacencyList.entries()) {
      for (const edge of edgeList) {
        // Sorting the endpoints before joining means (A,B) and (B,A)
        // produce the same key, so the reverse mirror edge is skipped
        const key = [source, edge.target].sort().join('->');
        if (!seen.has(key)) {
          seen.add(key);
          edges.push(edge);
        }
      }
    }
    return edges;
  }

  // Finds the specific edge going from source directly to target, if one exists
  public getEdge(source: string, target: string): LogisticsEdge | undefined {
    const edges = this.adjacencyList.get(source) || [];
    return edges.find(e => e.target === target);
  }

  // Returns the number of outgoing edges from a node
  // (used as degree centrality in the network analysis module)
  public getDegree(nodeId: string): number {
    return (this.adjacencyList.get(nodeId) || []).length;
  }

  // Builds a dense adjacency matrix representation of the graph,
  // used by algorithms that need direct O(1) edge-weight lookups
  // (e.g. Floyd-Warshall for all-pairs shortest paths)
  public getAdjacencyMatrix(): { matrix: number[][]; idMap: Map<string, number>; reverseMap: string[] } {
    const nodeIds = this.getAllNodeIds();
    // idMap/reverseMap translate between string node ids and matrix indices
    const idMap = new Map<string, number>();
    const reverseMap: string[] = [];
    const n = nodeIds.length;
    nodeIds.forEach((id, index) => {
      idMap.set(id, index);
      reverseMap.push(id);
    });

    // Start with all distances as unreachable (Infinity)
    const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(Infinity));
    // Distance from a node to itself is always 0
    for (let i = 0; i < n; i++) {
      matrix[i][i] = 0;
    }

    // Fill in known edge weights, accounting for blocked roads and traffic
    for (const [source, edges] of this.adjacencyList.entries()) {
      const u = idMap.get(source);
      if (u === undefined) continue;
      for (const edge of edges) {
        const v = idMap.get(edge.target);
        if (v !== undefined) {
          // Blocked edges are treated as unreachable regardless of their listed distance
          const effectiveDistance = edge.isBlocked ? Infinity : edge.distance * (edge.trafficMultiplier || 1);
          // Guard against duplicate/parallel edges by keeping the shortest one
          matrix[u][v] = Math.min(matrix[u][v], effectiveDistance);
        }
      }
    }
    return { matrix, idMap, reverseMap };
  }

  // Creates a deep-ish copy of the graph (new node/edge objects, same graph shape).
  // Useful for algorithms that need to mutate a graph (e.g. marking edges as
  // blocked for a "what-if" scenario) without affecting the original.
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
