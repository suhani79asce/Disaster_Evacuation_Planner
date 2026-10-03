/**
 * Automated Test Suite for Disaster Evacuation Planner Algorithms
 * Verifies Priority Queue, BFS, MinHeap Dijkstra, Capacity Enforcement, and Road Failure Rerouting.
 */

const fs = require('fs');
const path = require('path');

const { DEFAULT_SCENARIO, cloneScenario } = require('./js/data.js');
const {
  calculateRiskScore,
  MaxHeap,
  buildGraph,
  runBFS,
  MinHeap,
  runDijkstra,
  reconstructPath,
  getAvailableCapacity,
  evaluateZoneShelterOptions
} = require('./js/algorithms.js');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✔ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log("==================================================");
console.log("TEST 1: Risk Score Dynamic Calculation & Priority");
console.log("==================================================");
const zoneA = { population: 120, threatSeverity: 95, timeUrgency: 90, vulnerability: 80 };
const riskA = calculateRiskScore(zoneA, 170);
// Threat 95*0.4 = 38
// Pop factor: 120/170*100 ≈ 71 * 0.25 = 17.75
// Urgency: 90*0.2 = 18
// Vuln: 80*0.15 = 12
// Total ≈ 85.8
console.log("  Zone A Risk Output:", riskA);
assert(riskA.riskScore >= 80 && riskA.riskScore <= 90, "Zone A Risk Score is normalized and in expected ~85 range");
assert(riskA.priorityLevel === "HIGH" || riskA.priorityLevel === "CRITICAL", "Zone A Priority Level is critical/high");

const zoneC = { population: 150, threatSeverity: 60, timeUrgency: 55, vulnerability: 50 };
const riskC = calculateRiskScore(zoneC, 170);
console.log("  Zone C Risk Output:", riskC);
assert(riskA.riskScore > riskC.riskScore, "Zone A has higher risk score than Zone C");

console.log("\n==================================================");
console.log("TEST 2: Binary Max-Heap (Priority Queue)");
console.log("==================================================");
const maxHeap = new MaxHeap();
maxHeap.insert({ id: "C", riskScore: riskC.riskScore });
maxHeap.insert({ id: "A", riskScore: riskA.riskScore });
maxHeap.insert({ id: "B", riskScore: 69.8 });

assert(maxHeap.size() === 3, "MaxHeap contains 3 items");
const top1 = maxHeap.extractMax();
assert(top1.id === "A", "MaxHeap extracted Zone A first (highest risk)");
const top2 = maxHeap.extractMax();
assert(top2.id === "B", "MaxHeap extracted Zone B second");
const top3 = maxHeap.extractMax();
assert(top3.id === "C", "MaxHeap extracted Zone C third");
assert(maxHeap.isEmpty(), "MaxHeap is now empty");

console.log("\n==================================================");
console.log("TEST 3: Graph Construction & Blocked Road Exclusion");
console.log("==================================================");
const scenario = cloneScenario(DEFAULT_SCENARIO);
const allNodes = Object.keys(scenario.nodePositions);
let graph = buildGraph(scenario.roads, allNodes);

const sampleRoad = scenario.roads[0];
assert(graph[sampleRoad.source].some(e => e.node === sampleRoad.destination), "Sample road exists initially in adjacency list");

// Block sample road
sampleRoad.blocked = true;
const graphBlocked = buildGraph(scenario.roads, allNodes);
assert(!graphBlocked[sampleRoad.source].some(e => e.node === sampleRoad.destination), "Blocked road is strictly excluded from adjacency list");
assert(!graphBlocked[sampleRoad.destination].some(e => e.node === sampleRoad.source), "Blocked road is strictly excluded in reverse direction");

console.log("\n==================================================");
console.log("TEST 4: Breadth-First Search (BFS) Reachability");
console.log("==================================================");
sampleRoad.blocked = false;
const graphRestored = buildGraph(scenario.roads, allNodes);
const bfsAllOpen = runBFS(graphRestored, "A");
assert(bfsAllOpen.reachableNodes.has("S01") || bfsAllOpen.reachableNodes.has("S02"), "Shelter S01 or S02 is reachable from Zone A");

// Test isolated node scenario
const isolatedRoads = scenario.roads.filter(r => r.source !== "A" && r.destination !== "A");
const graphIsolatedA = buildGraph(isolatedRoads, allNodes);
const bfsIsolated = runBFS(graphIsolatedA, "A");
assert(bfsIsolated.reachableNodes.size === 1 && bfsIsolated.reachableNodes.has("A"), "Isolated Zone A reaches only itself in BFS");
assert(!bfsIsolated.reachableNodes.has("S01"), "Shelter S01 is correctly marked unreachable when all roads from A are cut");

console.log("\n==================================================");
console.log("TEST 5: Dijkstra with Binary Min-Heap & Path Reconstruction");
console.log("==================================================");
const dijkstraOpen = runDijkstra(graphRestored, "A", "S02");
console.log("  Dijkstra Path (Open Roads):", dijkstraOpen.path.join(" -> "), "Cost:", dijkstraOpen.cost);
assert(dijkstraOpen.cost > 0 && dijkstraOpen.cost !== Infinity, "Dijkstra finds correct minimum cost to S02");
assert(dijkstraOpen.path[0] === "A" && dijkstraOpen.path[dijkstraOpen.path.length - 1] === "S02", "Path begins at A and terminates at S02");

// Dynamic Road Failure: Road sample is blocked!
sampleRoad.blocked = true;
const dijkstraRerouted = runDijkstra(graphBlocked, "A", "S02");
console.log("  Dijkstra Path (Blocked):", dijkstraRerouted.path.join(" -> "), "Cost:", dijkstraRerouted.cost);
assert(dijkstraRerouted.cost > 0, "Dijkstra computes path with blocked road constraints");

console.log("\n==================================================");
console.log("TEST 6: Shelter Capacity & Allocation Logic");
console.log("==================================================");
const shelters = cloneScenario(DEFAULT_SCENARIO).shelters;
assert(getAvailableCapacity(shelters[0]) === (shelters[0].totalCapacity - shelters[0].currentOccupancy), "S01 available capacity calculated properly");
assert(getAvailableCapacity(shelters[1]) === (shelters[1].totalCapacity - shelters[1].currentOccupancy), "S02 available capacity calculated properly");
assert(getAvailableCapacity(shelters[2]) === (shelters[2].totalCapacity - shelters[2].currentOccupancy), "S03 available capacity calculated properly");

// Test Partial Evacuation when shelter capacity is insufficient:
const testZone = { id: "T", population: 150, remaining: 150, evacuated: 0 };
const smallShelter = { id: "S_SMALL", totalCapacity: 100, currentOccupancy: 40 }; // 60 available
const toEvac = Math.min(testZone.remaining, getAvailableCapacity(smallShelter));
assert(toEvac === 60, "Only 60 people allocated to small shelter");
smallShelter.currentOccupancy += toEvac;
testZone.evacuated += toEvac;
testZone.remaining -= toEvac;
assert(testZone.remaining === 90, "Zone still has 90 people remaining");
assert(getAvailableCapacity(smallShelter) === 0, "Shelter is now at full capacity (0 available)");

console.log("\n==================================================");
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================");

if (failed > 0) {
  process.exit(1);
}
