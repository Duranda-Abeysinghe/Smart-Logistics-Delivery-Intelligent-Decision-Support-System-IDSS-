/**
 * Min-Priority Queue implementation using a Binary Heap
 * Time Complexity: Push O(log n), Pop O(log n), Peek O(1)
 * Space Complexity: O(n)
 */
export class PriorityQueue<T> {
  // Internal array-backed binary heap. Each entry pairs an item with its priority.
  // heap[0] is always the minimum-priority element (min-heap property).
  private heap: { item: T; priority: number }[] = [];

  // Optional custom comparator for future extension (not currently used
  // internally - priority ordering is handled directly via numeric priority)
  constructor(private customCompare?: (a: T, b: T) => number) {}

  // Inserts an item with the given priority and restores heap order
  public push(item: T, priority: number): void {
    this.heap.push({ item, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  // Removes and returns the item with the lowest priority (the root of the heap)
  public pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0].item;
    // Move the last element to the root, then sink it down to restore heap order
    // (avoids shifting the whole array, keeping pop O(log n))
    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.sinkDown(0);
    }
    return top;
  }

  // Same as pop(), but also returns the priority value alongside the item
  // (useful when the caller needs the fScore/gScore, not just the node id)
  public popWithPriority(): { item: T; priority: number } | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.sinkDown(0);
    }
    return top;
  }

  // Returns the item with the lowest priority without removing it
  public peek(): T | undefined {
    return this.heap[0]?.item;
  }

  // Number of items currently in the queue
  public size(): number {
    return this.heap.length;
  }

  // Whether the queue has no items
  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  // Removes all items from the queue
  public clear(): void {
    this.heap = [];
  }

  // Restores heap order after insertion by moving a node up
  // toward the root while it's smaller than its parent
  private bubbleUp(index: number): void {
    const element = this.heap[index];
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIndex];
      // Stop once the element is no longer smaller than its parent
      if (element.priority >= parent.priority) break;
      this.heap[index] = parent;
      index = parentIndex;
    }
    this.heap[index] = element;
  }

  // Restores heap order after removal by moving a node down,
  // repeatedly swapping with its smallest child until heap order holds
  private sinkDown(index: number): void {
    const length = this.heap.length;
    const element = this.heap[index];
    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let swapIndex: number | null = null;

      // Check if the left child is smaller than the current element
      if (leftChildIndex < length) {
        if (this.heap[leftChildIndex].priority < element.priority) {
          swapIndex = leftChildIndex;
        }
      }
      // Check if the right child is smaller than whichever is currently
      // the smallest (either the element itself or the left child)
      if (rightChildIndex < length) {
        const compareTarget = swapIndex === null ? element.priority : this.heap[leftChildIndex].priority;
        if (this.heap[rightChildIndex].priority < compareTarget) {
          swapIndex = rightChildIndex;
        }
      }

      // No smaller child found - element is in its correct position
      if (swapIndex === null) break;

      this.heap[index] = this.heap[swapIndex];
      index = swapIndex;
    }
    this.heap[index] = element;
  }
}
