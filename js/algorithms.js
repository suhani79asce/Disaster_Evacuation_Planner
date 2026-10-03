/**
 * Disaster Evacuation Planner - DAA Algorithms Core
 * 
 * Contains:
 * 1. Priority Score calculation (Threat 40%, Pop Factor 25%, Urgency 20%, Vulnerability 15%)
 * 2. Binary MaxHeap (Priority Queue for Danger Zones with deterministic tie-breaking)
 * 3. Adjacency List Graph Builder (filters out blocked roads)
 * 4. Breadth-First Search (BFS for Level-by-level Reachability & Minimum-hop analysis)
 * 5. Binary MinHeap (Priority Queue for Dijkstra)
 * 6. Dijkstra's Algorithm (Minimum cost path finding with binary min-heap)
 * 7. Path reconstruction from predecessor map
 * 8. Shelter Capacity Validation & Infeasibility Analysis
 * 9. End-to-End Decision Generator ("Why This Decision?")
 */

// ==========================================
// 1. RISK / PRIORITY SCORE CALCULATION
// ==========================================

/**
 * Calculates dynamic Priority Score based on the required challenge formula:
 * Priority Score = 0.40 * Threat Severity + 0.25 * Population Factor + 0.20 * Time Urgency + 0.15 * Vulnerability
 * Population Factor = (Zone Population / Maximum Affected Population) * 100
 * All factors normalized to 0–100.
 */
function calculateRiskScore(zone, maxAffectedPopulation = 320) {
  const threat = Math.max(0, Math.min(100, Number(zone.threatSeverity) || 0));
  const urgency = Math.max(0, Math.min(100, Number(zone.timeUrgency) || 0));
  const vulnerability = Math.max(0, Math.min(100, Number(zone.vulnerability) || 0));
  
  // Normalize population factor relative to maximum affected population
  const pop = Number(zone.population) || 0;
  const maxPop = Math.max(1, Number(maxAffectedPopulation) || 100);
  const popFactor = Math.min(100, Math.round((pop / maxPop) * 100));

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
    breakdown: {
      threat: threat,
      population_factor: popFactor,
      urgency: urgency,
      vulnerability: vulnerability
    },
    formulaStr: `0.40×${threat} + 0.25×${popFactor} + 0.20×${urgency} + 0.15×${vulnerability}`
  };
}

// ==========================================
// 2. BINARY MAX HEAP (With Deterministic Tie-Breaking)
// ==========================================

/**
 * Deterministic tie-breaking comparator:
 * 1. Higher Priority / Risk Score
 * 2. Higher Threat Severity
 * 3. Higher Time Urgency
 * 4. Smaller Zone ID (alphabetical)
 */
function compareMaxHeapItems(a, b) {
  if (Math.abs(a.riskScore - b.riskScore) > 0.001) {
    return a.riskScore > b.riskScore;
  }
  // Tie-breaker 1: Higher Threat Severity
  const threatA = a.threatSeverity || (a.zone && a.zone.threatSeverity) || 0;
  const threatB = b.threatSeverity || (b.zone && b.zone.threatSeverity) || 0;
  if (threatA !== threatB) return threatA > threatB;

  // Tie-breaker 2: Higher Time Urgency
  const urgA = a.timeUrgency || (a.zone && a.zone.timeUrgency) || 0;
  const urgB = b.timeUrgency || (b.zone && b.zone.timeUrgency) || 0;
  if (urgA !== urgB) return urgA > urgB;

  // Tie-breaker 3: Smaller Zone ID
  const idA = a.id || a.zoneId || (a.zone && a.zone.id) || "";
  const idB = b.id || b.zoneId || (b.zone && b.zone.id) || "";
  return String(idA).localeCompare(String(idB)) < 0;
}

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
      if (compareMaxHeapItems(this.heap[index], this.heap[parentIndex])) {
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

      if (leftChild < length && compareMaxHeapItems(this.heap[leftChild], this.heap[largest])) {
        largest = leftChild;
      }

      if (rightChild < length && compareMaxHeapItems(this.heap[rightChild], this.heap[largest])) {
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
 * Supports both road.blocked === true and road.status === "blocked".
 */
function buildGraph(roads, allNodeIds = []) {
  const adj = {};

  allNodeIds.forEach(id => {
    adj[id] = [];
  });

  roads.forEach(road => {
    const isBlocked = road.blocked === true || road.status === "blocked";
    if (isBlocked) {
      // Ignore blocked roads completely
      return;
    }
    const u = road.source || road.from;
    const v = road.destination || road.to;
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
// 4. BREADTH FIRST SEARCH (BFS: Levels & Minimum Hops)
// ==========================================

/**
 * Runs genuine BFS from startNode to find all reachable nodes,
 * levels of exploration, hop counts, and identifies the minimum-hop reachable shelter.
 */
function runBFS(graph, startNode, shelterIds = []) {
  const visited = new Set();
  const queue = [{ node: startNode, level: 0 }];
  const visitedOrder = [];
  const parentMap = {};
  const levels = [];
  const hopCount = {};
  const shelterSet = new Set(shelterIds);

  visited.add(startNode);
  parentMap[startNode] = null;
  hopCount[startNode] = 0;

  while (queue.length > 0) {
    const { node: curr, level } = queue.shift();
    visitedOrder.push(curr);

    if (!levels[level]) levels[level] = [];
    levels[level].push(curr);

    const neighbors = graph[curr] || [];
    for (const edge of neighbors) {
      const neighbor = edge.node;
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parentMap[neighbor] = curr;
        hopCount[neighbor] = level + 1;
        queue.push({ node: neighbor, level: level + 1 });
      }
    }
  }

  // Reachable shelters & minimum hop analysis
  const reachableShelters = [];
  let minimumHopShelter = null;
  let minimumHops = Infinity;

  shelterSet.forEach(sId => {
    if (visited.has(sId)) {
      const hops = hopCount[sId];
      reachableShelters.push({
        id: sId,
        hops: hops
      });
      if (hops < minimumHops) {
        minimumHops = hops;
        minimumHopShelter = sId;
      }
    }
  });

  return {
    reachableNodes: visited,
    visitedOrder,
    parentMap,
    levels,
    hopCount,
    reachableShelters,
    minimumHopShelter,
    minimumHops: minimumHops === Infinity ? null : minimumHops
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
 * Runs genuine Dijkstra's Algorithm with Binary Min-Heap.
 * Maintains:
 * - dist (tentative costs for each node)
 * - visited nodes / visitedOrder
 * - predecessor map (prev)
 * - selected cheapest unexplored node
 * - path reconstruction
 */
function runDijkstra(graph, startNode, targetNode = null) {
  const dist = {};
  const prev = {};
  const finalized = new Set();
  const visitedOrder = [];
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

    if (finalized.has(u)) continue;
    finalized.add(u);
    visitedOrder.push(u);

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
    visitedOrder,
    finalized: Array.from(finalized),
    relaxationSteps
  };
}

/**
 * Reconstructs path backwards from target to start using predecessor map.
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
    return [];
  }

  return path;
}

// ==========================================
// 7. SHELTER CAPACITY & FEASIBILITY VALIDATION
// ==========================================

function getAvailableCapacity(shelter) {
  const total = Number(shelter.totalCapacity || shelter.total_capacity) || 0;
  const occupied = Number(shelter.currentOccupancy || shelter.occupied_capacity) || 0;
  return Math.max(0, total - occupied);
}

/**
 * Complete DAA Evaluation Pipeline for a given Danger Zone:
 * 1. Calculate Priority Score & breakdown.
 * 2. Run BFS for reachability and minimum hops.
 * 3. Validate shelter capacity (reject insufficient capacity).
 * 4. Run Dijkstra to each feasible shelter.
 * 5. Select minimum-cost feasible shelter.
 * 6. Generate detailed plain-language explanation ("Why This Decision?").
 */
function evaluateZoneShelterOptions(zone, allShelters, graph, allZones = []) {
  const maxPop = allZones.length > 0 
    ? Math.max(...allZones.map(z => Number(z.population) || 0)) 
    : (Number(zone.population) || 100);

  const priorityResult = calculateRiskScore(zone, maxPop);
  const requiredPop = Number(zone.remaining !== undefined ? zone.remaining : zone.population) || 0;
  const shelterIds = allShelters.map(s => s.id);

  // Step 1: Run BFS
  const bfsResult = runBFS(graph, zone.id, shelterIds);
  const reachableNodes = bfsResult.reachableNodes;

  // Step 2 & 3: Audit every shelter for reachability and capacity
  const sheltersAudit = {};
  const feasibleShelters = [];
  const rejectedShelters = [];

  allShelters.forEach(s => {
    const isReachable = reachableNodes.has(s.id);
    const availCap = getAvailableCapacity(s);
    const hasCapacity = availCap >= requiredPop;
    const isFeasible = isReachable && hasCapacity;

    let reason = "Feasible";
    if (!isReachable) {
      reason = "Unreachable (BFS: No open path)";
    } else if (!hasCapacity) {
      reason = `Insufficient capacity: Required ${requiredPop} > Available ${availCap}`;
    }

    const auditEntry = {
      id: s.id,
      name: s.name,
      total_capacity: s.totalCapacity,
      occupied_capacity: s.currentOccupancy,
      available_capacity: availCap,
      required_population: requiredPop,
      reachable: isReachable,
      feasible: isFeasible,
      reason: reason
    };

    sheltersAudit[s.id] = auditEntry;

    if (isFeasible) {
      feasibleShelters.push(s);
    } else {
      rejectedShelters.push(auditEntry);
    }
  });

  // Step 4: Run Dijkstra to feasible shelters (or reachable shelters with partial capacity if none fully feasible)
  const candidateShelters = feasibleShelters.length > 0 
    ? feasibleShelters 
    : allShelters.filter(s => reachableNodes.has(s.id) && getAvailableCapacity(s) > 0);

  const shelterRoutes = [];
  candidateShelters.forEach(s => {
    const dijkstraResult = runDijkstra(graph, zone.id, s.id);
    if (dijkstraResult.cost !== Infinity && dijkstraResult.path.length > 0) {
      shelterRoutes.push({
        shelter: s,
        cost: dijkstraResult.cost,
        path: dijkstraResult.path,
        availableCapacity: getAvailableCapacity(s),
        dijkstraResult: dijkstraResult,
        isFullyFeasible: feasibleShelters.includes(s)
      });
    }
  });

  // Sort by lowest Dijkstra travel cost
  shelterRoutes.sort((a, b) => a.cost - b.cost);

  const bestOption = shelterRoutes.length > 0 ? shelterRoutes[0] : null;

  // Build "Why This Decision?" Explanation
  const explanation = {
    why_zone_prioritized: `Zone ${zone.id} was prioritized with a Priority Score of ${priorityResult.riskScore}/100 ` +
      `(Threat: ${priorityResult.threat}/100, Pop Factor: ${priorityResult.popFactor}/100, Urgency: ${priorityResult.urgency}/100, Vulnerability: ${priorityResult.vulnerability}/100). ` +
      `Extracted from the root of the Binary Max-Heap because it represents the highest emergency triage risk.`,
    
    why_shelter_selected: bestOption
      ? `Shelter ${bestOption.shelter.id} was selected because it is reachable via BFS (${bfsResult.hopCount[bestOption.shelter.id] || 0} hops), ` +
        `has sufficient capacity (${bestOption.availableCapacity} available >= ${requiredPop} required), ` +
        `and achieves the minimum Dijkstra travel cost (${bestOption.cost.toFixed ? bestOption.cost.toFixed(1) : bestOption.cost} km). ` +
        `Other shelters were either unreachable or rejected due to capacity limits.`
      : `No shelter could be selected: all available shelters are either physically unreachable due to road blockages or have insufficient capacity.`
  };

  return {
    selected_zone: zone.id,
    zone: zone,
    priority_score: priorityResult.riskScore,
    priority_level: priorityResult.priorityLevel,
    priority_breakdown: priorityResult.breakdown,
    bfs: bfsResult,
    shelters: sheltersAudit,
    feasibleShelters: feasibleShelters,
    rejectedShelters: rejectedShelters,
    shelterRoutes: shelterRoutes,
    bestOption: bestOption,
    dijkstra: bestOption ? {
      target_shelter: bestOption.shelter.id,
      route: bestOption.path,
      total_cost: bestOption.cost,
      visited_order: bestOption.dijkstraResult.visitedOrder,
      tentative_costs: bestOption.dijkstraResult.dist
    } : null,
    explanation: explanation
  };
}

// Node.js and Global exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateRiskScore,
    compareMaxHeapItems,
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
    compareMaxHeapItems,
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
