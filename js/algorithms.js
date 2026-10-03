/**
 * Disaster Evacuation Planner - DAA Algorithms Core
 * 
 * Contains:
 * 1. Binary MaxHeap (Priority Queue for Danger Zones by Risk Score)
 * 2. Risk Score calculation (Threat, Pop Factor, Urgency, Vulnerability)
 * 3. Adjacency List Graph Builder (filters out blocked roads)
 * 4. Breadth-First Search (BFS for Reachability verification)
 * 5. Binary MinHeap (Priority Queue for Dijkstra)
 * 6. Dijkstra's Algorithm (Minimum cost path finding with binary min-heap)
 * 7. Path reconstruction from predecessor map
 * 8. Shelter selection, capacity checking, and population allocation
 */

// ==========================================
// 1. RISK SCORE & PRIORITY LEVEL
// ==========================================

/**
 * Calculates dynamic risk score based on formula:
 * Risk Score = 0.40 * Threat Severity + 0.25 * Population Factor + 0.20 * Time Urgency + 0.15 * Vulnerability
 * All values normalized 0-100.
 */
function calculateRiskScore(zone, maxPopulationBenchmark = 170) {
  const threat = Math.max(0, Math.min(100, Number(zone.threatSeverity) || 0));
  const urgency = Math.max(0, Math.min(100, Number(zone.timeUrgency) || 0));
  const vulnerability = Math.max(0, Math.min(100, Number(zone.vulnerability) || 0));
  
  // Normalize population factor to 0-100
  const pop = Number(zone.population) || 0;
  const benchmark = Math.max(100, maxPopulationBenchmark);
  const popFactor = Math.min(100, Math.round((pop / benchmark) * 100));

  const rawScore = (0.40 * threat) + (0.25 * popFactor) + (0.20 * urgency) + (0.15 * vulnerability);
  const riskScore = Math.round(rawScore * 10) / 10; // 1 decimal place

  let priorityLevel = "LOW";
  let badgeClass = "badge-low";
  if (riskScore >= 90) {
    priorityLevel = "CRITICAL";
    badgeClass = "badge-critical";
  } else if (riskScore >= 75) {
    priorityLevel = "HIGH";
    badgeClass = "badge-high";
  } else if (riskScore >= 50) {
    priorityLevel = "MEDIUM";
    badgeClass = "badge-medium";
  }

  return {
    riskScore,
    popFactor,
    threat,
    urgency,
    vulnerability,
    priorityLevel,
    badgeClass,
    breakdown: `0.40×${threat} + 0.25×${popFactor} + 0.20×${urgency} + 0.15×${vulnerability}`
  };
}

// ==========================================
// 2. BINARY MAX HEAP (For Danger Zones)
// ==========================================

class MaxHeap {
  constructor() {
    this.heap = [];
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  insert(item) {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[index].riskScore > this.heap[parentIndex].riskScore) {
        // Swap
        [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  extractMax() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const max = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.bubbleDown(0);
    return max;
  }

  bubbleDown(index) {
    const length = this.heap.length;
    while (true) {
      let largest = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      if (leftChild < length && this.heap[leftChild].riskScore > this.heap[largest].riskScore) {
        largest = leftChild;
      }

      if (rightChild < length && this.heap[rightChild].riskScore > this.heap[largest].riskScore) {
        largest = rightChild;
      }

      if (largest !== index) {
        [this.heap[index], this.heap[largest]] = [this.heap[largest], this.heap[index]];
        index = largest;
      } else {
        break;
      }
    }
  }

  toArray() {
    return [...this.heap];
  }
}

// ==========================================
// 3. GRAPH REPRESENTATION (Adjacency List)
// ==========================================

/**
 * Builds an adjacency list from roads, strictly ignoring blocked roads.
 */
function buildGraph(roads, allNodeIds = []) {
  const adj = {};

  // Initialize all nodes
  allNodeIds.forEach(id => {
    adj[id] = [];
  });

  roads.forEach(road => {
    if (road.blocked) {
      // Ignore blocked roads completely
      return;
    }
    const u = road.source;
    const v = road.destination;
    const cost = Number(road.cost);

    if (!adj[u]) adj[u] = [];
    if (!adj[v]) adj[v] = [];

    // Bidirectional roads
    adj[u].push({ node: v, cost: cost, roadId: road.id });
    adj[v].push({ node: u, cost: cost, roadId: road.id });
  });

  return adj;
}

// ==========================================
// 4. BREADTH FIRST SEARCH (BFS for Reachability)
// ==========================================

/**
 * Runs genuine BFS from startNode to find all reachable nodes.
 * Explores layer by layer using a FIFO queue.
 * Returns reachable nodes set, traversal order, and predecessor map.
 */
function runBFS(graph, startNode) {
  const visited = new Set();
  const queue = [startNode];
  const visitedOrder = [];
  const parentMap = {};

  visited.add(startNode);
  parentMap[startNode] = null;

  while (queue.length > 0) {
    const curr = queue.shift();
    visitedOrder.push(curr);

    const neighbors = graph[curr] || [];
    for (const edge of neighbors) {
      const neighbor = edge.node;
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parentMap[neighbor] = curr;
        queue.push(neighbor);
      }
    }
  }

  return {
    reachableNodes: visited,
    visitedOrder,
    parentMap
  };
}

// ==========================================
// 5. BINARY MIN HEAP (For Dijkstra's Algorithm)
// ==========================================

class MinHeap {
  constructor() {
    this.heap = [];
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  insert(element) {
    // element: { node: string, dist: number }
    this.heap.push(element);
    this.bubbleUp(this.heap.length - 1);
  }

  bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[index].dist < this.heap[parentIndex].dist) {
        // Swap
        [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  extractMin() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.bubbleDown(0);
    return min;
  }

  bubbleDown(index) {
    const length = this.heap.length;
    while (true) {
      let smallest = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      if (leftChild < length && this.heap[leftChild].dist < this.heap[smallest].dist) {
        smallest = leftChild;
      }

      if (rightChild < length && this.heap[rightChild].dist < this.heap[smallest].dist) {
        smallest = rightChild;
      }

      if (smallest !== index) {
        [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
        index = smallest;
      } else {
        break;
      }
    }
  }
}

// ==========================================
// 6. DIJKSTRA'S ALGORITHM
// ==========================================

/**
 * Runs genuine Dijkstra's Algorithm using Binary Min-Heap.
 * Finds shortest cost paths from startNode to targetNode (or all nodes if targetNode is null).
 * Returns: { dist, prev, cost, path, relaxationSteps }
 */
function runDijkstra(graph, startNode, targetNode = null) {
  const dist = {};
  const prev = {};
  const finalized = new Set();
  const relaxationSteps = [];

  // Initialize distance table
  for (const node of Object.keys(graph)) {
    dist[node] = Infinity;
    prev[node] = null;
  }
  dist[startNode] = 0;

  const minHeap = new MinHeap();
  minHeap.insert({ node: startNode, dist: 0 });

  while (!minHeap.isEmpty()) {
    const { node: u, dist: currentDist } = minHeap.extractMin();

    // If already finalized, skip (lazy deletion handling in heap)
    if (finalized.has(u)) continue;
    finalized.add(u);

    // If we only care about a specific targetNode and it's finalized, we can break early
    if (targetNode && u === targetNode) {
      break;
    }

    const neighbors = graph[u] || [];
    for (const edge of neighbors) {
      const v = edge.node;
      const weight = edge.cost;

      if (!finalized.has(v)) {
        const newDist = currentDist + weight;
        if (newDist < dist[v]) {
          relaxationSteps.push({
            from: u,
            to: v,
            oldDist: dist[v],
            newDist: newDist,
            weight: weight
          });
          dist[v] = newDist;
          prev[v] = u;
          minHeap.insert({ node: v, dist: newDist });
        }
      }
    }
  }

  // Reconstruct path if targetNode provided
  let path = [];
  let cost = Infinity;

  if (targetNode) {
    cost = dist[targetNode];
    if (cost !== Infinity) {
      path = reconstructPath(prev, startNode, targetNode);
    }
  }

  return {
    dist,
    prev,
    cost,
    path,
    relaxationSteps
  };
}

/**
 * Reconstructs path backwards from target to start using the predecessor map.
 */
function reconstructPath(prevMap, startNode, targetNode) {
  const path = [];
  let curr = targetNode;

  while (curr !== null && curr !== undefined) {
    path.unshift(curr);
    if (curr === startNode) break;
    curr = prevMap[curr];
  }

  if (path[0] !== startNode) {
    // Target is unreachable
    return [];
  }

  return path;
}

// ==========================================
// 7. SHELTER CAPACITY & FEASIBILITY HELPERS
// ==========================================

/**
 * Computes available capacity for a shelter.
 */
function getAvailableCapacity(shelter) {
  return Math.max(0, shelter.totalCapacity - shelter.currentOccupancy);
}

/**
 * Step 1-6 Decision Engine for a given Zone:
 * 1. Run BFS from zone.
 * 2. Identify reachable shelters.
 * 3. Filter reachable shelters with available capacity > 0.
 * 4. Run Dijkstra to each feasible shelter.
 * 5. Compare route costs and pick shelter with minimum valid route cost.
 */
function evaluateZoneShelterOptions(zone, allShelters, graph) {
  // Step 1: Run BFS
  const bfsResult = runBFS(graph, zone.id);
  const reachableNodes = bfsResult.reachableNodes;

  const reachableShelters = [];
  const unreachableShelters = [];
  const feasibleShelters = [];
  const fullShelters = [];

  allShelters.forEach(s => {
    const isReachable = reachableNodes.has(s.id);
    const availableCap = getAvailableCapacity(s);

    if (!isReachable) {
      unreachableShelters.push({ shelter: s, reason: "Unreachable (BFS: No open path)" });
    } else {
      reachableShelters.push(s);
      if (availableCap <= 0) {
        fullShelters.push({ shelter: s, reason: "At full capacity (0 available)" });
      } else {
        feasibleShelters.push(s);
      }
    }
  });

  // If no feasible shelters
  if (feasibleShelters.length === 0) {
    let failureReason = "NO_REACHABLE_SHELTERS";
    if (reachableShelters.length > 0) {
      failureReason = "ALL_REACHABLE_SHELTERS_FULL";
    }
    return {
      bfsResult,
      reachableShelters,
      unreachableShelters,
      fullShelters,
      feasibleShelters: [],
      bestOption: null,
      failureReason
    };
  }

  // Step 4 & 5: Run Dijkstra to each feasible shelter and compare costs
  const shelterRoutes = [];
  feasibleShelters.forEach(s => {
    const dijkstraResult = runDijkstra(graph, zone.id, s.id);
    if (dijkstraResult.cost !== Infinity && dijkstraResult.path.length > 0) {
      shelterRoutes.push({
        shelter: s,
        cost: dijkstraResult.cost,
        path: dijkstraResult.path,
        availableCapacity: getAvailableCapacity(s),
        dijkstraResult
      });
    }
  });

  // Sort by minimum route cost
  shelterRoutes.sort((a, b) => a.cost - b.cost);

  const bestOption = shelterRoutes.length > 0 ? shelterRoutes[0] : null;

  return {
    bfsResult,
    reachableShelters,
    unreachableShelters,
    fullShelters,
    feasibleShelters,
    shelterRoutes,
    bestOption,
    failureReason: bestOption ? null : "NO_VALID_ROUTE"
  };
}

// Node.js and global compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateRiskScore,
    MaxHeap,
    buildGraph,
    runBFS,
    MinHeap,
    runDijkstra,
    reconstructPath,
    getAvailableCapacity,
    evaluateZoneShelterOptions
  };
}
if (typeof globalThis !== 'undefined') {
  Object.assign(globalThis, {
    calculateRiskScore,
    MaxHeap,
    buildGraph,
    runBFS,
    MinHeap,
    runDijkstra,
    reconstructPath,
    getAvailableCapacity,
    evaluateZoneShelterOptions
  });
}
