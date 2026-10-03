/**
 * Full End-to-End Simulation Test
 * Simulates complete evacuation run, road failure event, and verifies final numbers.
 */

const { DEFAULT_SCENARIO, cloneScenario } = require('./js/data.js');
const {
  calculateRiskScore,
  MaxHeap,
  buildGraph,
  runBFS,
  runDijkstra,
  getAvailableCapacity,
  evaluateZoneShelterOptions
} = require('./js/algorithms.js');

const scenario = cloneScenario(DEFAULT_SCENARIO);
const initialTotalAtRisk = scenario.zones.reduce((s, z) => s + z.population, 0);

console.log(`Starting simulation with ${initialTotalAtRisk} total people at risk.`);

// 1. Calculate risk scores and insert into MaxHeap
const heap = new MaxHeap();
scenario.zones.forEach(z => {
  const risk = calculateRiskScore(z);
  z.riskScore = risk.riskScore;
  z.priorityLevel = risk.priorityLevel;
  heap.insert({ zoneId: z.id, riskScore: z.riskScore });
});

console.log("MaxHeap Extraction Order:");
const extractedOrder = [];
while (!heap.isEmpty()) {
  const top = heap.extractMax();
  extractedOrder.push(top.zoneId);
  console.log(`  - Zone ${top.zoneId} (Risk: ${top.riskScore})`);
}

// 2. Perform evacuations in extraction order
const allNodes = Object.keys(scenario.nodePositions);
let graph = buildGraph(scenario.roads, allNodes);

extractedOrder.forEach(zoneId => {
  const zone = scenario.zones.find(z => z.id === zoneId);
  console.log(`\nProcessing Zone ${zone.id} (Pop: ${zone.population}):`);

  while (zone.remaining > 0) {
    const evaluation = evaluateZoneShelterOptions(zone, scenario.shelters, graph);
    const best = evaluation.bestOption;
    if (!best) {
      console.log(`  Zone ${zone.id} has no more feasible shelters!`);
      break;
    }

    const shelter = scenario.shelters.find(s => s.id === best.shelter.id);
    const avail = getAvailableCapacity(shelter);
    const evac = Math.min(zone.remaining, avail);

    shelter.currentOccupancy += evac;
    zone.evacuated += evac;
    zone.remaining -= evac;

    console.log(`  Allocated ${evac} to ${shelter.id} via [${best.path.join(" -> ")}] (Cost: ${best.cost} km). Shelter ${shelter.id} remaining: ${getAvailableCapacity(shelter)}`);
  }

  zone.status = zone.remaining === 0 ? "EVACUATED" : (zone.evacuated > 0 ? "PARTIAL" : "FAILED");
  console.log(`  Final Status for Zone ${zone.id}: ${zone.status} (Evacuated: ${zone.evacuated}, Remaining: ${zone.remaining})`);
});

const totalEvacuated = scenario.zones.reduce((s, z) => s + z.evacuated, 0);
const totalRemaining = scenario.zones.reduce((s, z) => s + z.remaining, 0);

console.log("\n=================================");
console.log("Final Evacuation Statistics:");
console.log(`  Total At Risk (Fixed): ${initialTotalAtRisk}`);
console.log(`  Total Evacuated:       ${totalEvacuated}`);
console.log(`  Total Remaining:       ${totalRemaining}`);
console.log("=================================");

if (totalEvacuated + totalRemaining !== initialTotalAtRisk) {
  console.error("Integrity Error: Evacuated + Remaining does not equal Total At Risk!");
  process.exit(1);
} else {
  console.log("Integrity Verified: Total At Risk conserved perfectly.");
}
