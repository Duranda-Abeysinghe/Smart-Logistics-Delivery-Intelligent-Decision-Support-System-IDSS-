/**
 * Disjoint Set Union (Union-Find) with Path Compression and Union by Rank
 * Used for network connectivity, cycle detection, and Kruskal MST
 * Time Complexity: Amortized O(alpha(n)) ~ O(1) per operation
 */
export class DisjointSet<T = string> {
  private parent: Map<T, T> = new Map();
  private rank: Map<T, number> = new Map();
  private numComponents: number = 0;

  constructor(elements?: T[]) {
    if (elements) {
      elements.forEach(elem => this.makeSet(elem));
    }
  }
// Create a new set
  public makeSet(elem: T): void {
    if (!this.parent.has(elem)) {
      this.parent.set(elem, elem);
      this.rank.set(elem, 0);
      this.numComponents++;
    }
  }
// Find the root
  public find(elem: T): T {
    if (!this.parent.has(elem)) {
      this.makeSet(elem);
      return elem;
    }

    const currentParent = this.parent.get(elem)!;
    if (currentParent !== elem) {
      const root = this.find(currentParent);
      this.parent.set(elem, root); // Path compression
      return root;
    }
    return elem;
  }

  public union(elemA: T, elemB: T): boolean {
    const rootA = this.find(elemA);
    const rootB = this.find(elemB);

    if (rootA === rootB) {
      return false; // Already in same set
    }

    const rankA = this.rank.get(rootA) || 0;
    const rankB = this.rank.get(rootB) || 0;

    // Union by rank
    if (rankA < rankB) {
      this.parent.set(rootA, rootB);
    } else if (rankA > rankB) {
      this.parent.set(rootB, rootA);
    } else {
      this.parent.set(rootB, rootA);
      this.rank.set(rootA, rankA + 1);
    }

    this.numComponents--;
    return true;
  }

  public isConnected(elemA: T, elemB: T): boolean {
    return this.find(elemA) === this.find(elemB);
  }

  public getComponentCount(): number {
    return this.numComponents;
  }
}
