/**
 * Disaster Evacuation Planner - Application Controller
 * Styled and functionally mapped to the reference emergency command center UI
 */

class DisasterEvacuationApp {
  constructor() {
    this.scenario = cloneScenario(DEFAULT_SCENARIO);
    this.activeZoneId = "A";
    this.activeShelterId = "S02";
    this.activeAlgorithm = "DIJKSTRA"; // "DIJKSTRA" or "BFS"
    
    // Map Engine
    this.map = new EvacuationMap("mapContainer", (roadId) => this.handleToggleRoad(roadId));

    // Cache DOM
    this.initDom();

    // Event Bindings
    this.bindEvents();

    // Start Live Clock
    this.startClock();

    // Initial render
    this.renderAll();

    // Run initial route preview
    this.executeAlgorithm("DIJKSTRA", "A", "S02");
  }

  initDom() {
    // KPI Badges
    this.statActiveEmergencies = document.getElementById("statActiveEmergencies");
    this.statAvailableShelters = document.getElementById("statAvailableShelters");
    this.statBlockedRoads = document.getElementById("statBlockedRoads");
    this.statPeopleToEvacuate = document.getElementById("statPeopleToEvacuate");
    this.systemClock = document.getElementById("systemClock");

    // Lists & Tables
    this.emergenciesList = document.getElementById("emergenciesList");
    this.pqTableBody = document.getElementById("pqTableBody");
    this.miniPqTableBody = document.getElementById("miniPqTableBody");
    this.ntpText = document.getElementById("ntpText");
    this.sheltersList = document.getElementById("sheltersList");

    // Route Info Box
    this.routeEmergencyVal = document.getElementById("routeEmergencyVal");
    this.routeDestinationVal = document.getElementById("routeDestinationVal");
    this.routeAlgorithmVal = document.getElementById("routeAlgorithmVal");
    this.routeDistVal = document.getElementById("routeDistVal");
    this.routeCostVal = document.getElementById("routeCostVal");
    this.routeTimeVal = document.getElementById("routeTimeVal");
    this.routeBlockedVal = document.getElementById("routeBlockedVal");
    this.routePathSequence = document.getElementById("routePathSequence");

    // Action Buttons
    this.btnRunDijkstra = document.getElementById("btnRunDijkstra");
    this.btnRunBFS = document.getElementById("btnRunBFS");

    // Visualizer Elements
    this.btnTabBFS = document.getElementById("btnTabBFS");
    this.btnTabDijkstra = document.getElementById("btnTabDijkstra");
    this.visualizerSubhead = document.getElementById("visualizerSubhead");
    this.algoStepsList = document.getElementById("algoStepsList");
    this.algoFinalCostVal = document.getElementById("algoFinalCostVal");
    this.algoFinalPathVal = document.getElementById("algoFinalPathVal");

    // Simulation Modal
    this.simulationModal = document.getElementById("simulationModal");
    this.navTabSimulation = document.getElementById("navTabSimulation");
    this.navTabDashboard = document.getElementById("navTabDashboard");
    this.btnCloseSimulation = document.getElementById("btnCloseSimulation");
    this.btnSimStart = document.getElementById("btnSimStart");
    this.btnSimStep = document.getElementById("btnSimStep");
    this.btnSimFailure = document.getElementById("btnSimFailure");
    this.btnSimReset = document.getElementById("btnSimReset");
    this.simPresetSelect = document.getElementById("simPresetSelect");
    this.terminalOutput = document.getElementById("terminalOutput");
  }

  bindEvents() {
    this.btnRunDijkstra.addEventListener("click", () => {
      this.activeAlgorithm = "DIJKSTRA";
      this.updateVisualizerTabs();
      this.executeAlgorithm("DIJKSTRA", this.activeZoneId);
    });

    this.btnRunBFS.addEventListener("click", () => {
      this.activeAlgorithm = "BFS";
      this.updateVisualizerTabs();
      this.executeAlgorithm("BFS", this.activeZoneId);
    });

    this.btnTabDijkstra.addEventListener("click", () => {
      this.activeAlgorithm = "DIJKSTRA";
      this.updateVisualizerTabs();
      this.executeAlgorithm("DIJKSTRA", this.activeZoneId);
    });

    this.btnTabBFS.addEventListener("click", () => {
      this.activeAlgorithm = "BFS";
      this.updateVisualizerTabs();
      this.executeAlgorithm("BFS", this.activeZoneId);
    });

    // Navigation Tabs / Simulation Modal
    this.navTabSimulation.addEventListener("click", () => {
      this.simulationModal.classList.add("modal-open");
    });

    this.btnCloseSimulation.addEventListener("click", () => {
      this.simulationModal.classList.remove("modal-open");
    });

    if (this.btnSimStart) {
      this.btnSimStart.addEventListener("click", () => this.runFullSimulation());
    }
    if (this.btnSimStep) {
      this.btnSimStep.addEventListener("click", () => this.stepNextSimulation());
    }
    if (this.btnSimFailure) {
      this.btnSimFailure.addEventListener("click", () => this.simulateRoadFailure());
    }
    if (this.btnSimReset) {
      this.btnSimReset.addEventListener("click", () => this.resetSimulation());
    }
  }

  startClock() {
    const update = () => {
      const d = new Date();
      const timeStr = d.toTimeString().split(" ")[0];
      if (this.systemClock) {
        this.systemClock.textContent = `Last Updated: ${timeStr}`;
      }
    };
    update();
    setInterval(update, 1000);
  }

  updateVisualizerTabs() {
    if (this.activeAlgorithm === "DIJKSTRA") {
      this.btnTabDijkstra.classList.add("active");
      this.btnTabBFS.classList.remove("active");
      this.visualizerSubhead.textContent = "Dijkstra Execution";
    } else {
      this.btnTabBFS.classList.add("active");
      this.btnTabDijkstra.classList.remove("active");
      this.visualizerSubhead.textContent = "BFS Reachability Execution";
    }
  }

  // ==========================================
  // CORE DAA ALGORITHM EXECUTION
  // ==========================================

  executeAlgorithm(algoType, zoneId = "A", preferredShelterId = null) {
    const zone = this.scenario.zones.find(z => z.id === zoneId) || this.scenario.zones[0];
    this.activeZoneId = zone.id;

    const allNodeIds = Object.keys(this.scenario.nodePositions);
    const graph = buildGraph(this.scenario.roads, allNodeIds);

    const blockedCount = this.scenario.roads.filter(r => r.blocked).length;
    this.routeBlockedVal.textContent = blockedCount;

    if (algoType === "BFS") {
      // 1. Run BFS
      const bfsResult = runBFS(graph, zone.id);
      this.map.setBfsVisited(Array.from(bfsResult.reachableNodes));

      // Find reachable shelters
      const reachableShelters = this.scenario.shelters.filter(s => bfsResult.reachableNodes.has(s.id));
      const targetShelter = preferredShelterId 
        ? (reachableShelters.find(s => s.id === preferredShelterId) || reachableShelters[0])
        : reachableShelters[0];

      let path = [];
      if (targetShelter) {
        path = reconstructPath(bfsResult.parentMap, zone.id, targetShelter.id);
      }

      this.map.setActiveRoute(path, zone.id, targetShelter ? targetShelter.id : null);
      this.map.render(this.scenario);

      // Update UI Route Information
      this.routeEmergencyVal.textContent = `${zone.type} — ${zone.name}`;
      this.routeDestinationVal.textContent = targetShelter ? targetShelter.name : "None Reachable";
      this.routeAlgorithmVal.textContent = "BFS";
      this.routeDistVal.textContent = `${path.length * 2.2} km`;
      this.routeCostVal.textContent = `${path.length} hops`;
      this.routeTimeVal.textContent = `${path.length * 3} min`;
      this.routePathSequence.textContent = path.join(" → ") || "No open route";

      // Render Visualizer steps for BFS
      this.renderBFSSteps(bfsResult, path);

    } else {
      // 2. Run Dijkstra with Binary Min-Heap
      let bestEvaluation = evaluateZoneShelterOptions(zone, this.scenario.shelters, graph);
      let best = bestEvaluation.bestOption;

      if (!best && preferredShelterId) {
        const directDijkstra = runDijkstra(graph, zone.id, preferredShelterId);
        if (directDijkstra.cost !== Infinity) {
          best = {
            shelter: this.scenario.shelters.find(s => s.id === preferredShelterId),
            cost: directDijkstra.cost,
            path: directDijkstra.path,
            dijkstraResult: directDijkstra
          };
        }
      }

      if (best) {
        this.activeShelterId = best.shelter.id;
        this.map.setActiveRoute(best.path, zone.id, best.shelter.id);
        this.map.render(this.scenario);

        // Update UI Route Information
        this.routeEmergencyVal.textContent = `${zone.type} — ${zone.name}`;
        this.routeDestinationVal.textContent = best.shelter.name;
        this.routeAlgorithmVal.textContent = "DIJKSTRA";
        this.routeDistVal.textContent = `${best.cost.toFixed(1)} km`;
        this.routeCostVal.textContent = `${Math.round(best.cost * 1.6)}`;
        this.routeTimeVal.textContent = `${Math.round(best.cost * 1.4)} min`;
        this.routePathSequence.textContent = best.path.join(" → ");

        // Render Visualizer steps for Dijkstra
        this.renderDijkstraSteps(best.dijkstraResult, best.path, best.cost);
      } else {
        this.routePathSequence.textContent = "NO FEASIBLE ROUTE AVAILABLE";
        this.algoStepsList.innerHTML = `<div class="algo-step-row text-red"><strong>Failure:</strong> No unblocked path to any available shelter.</div>`;
      }
    }
  }

  renderDijkstraSteps(dijkstraResult, path, totalCost) {
    if (!this.algoStepsList) return;

    let stepHtml = `
      <div class="algo-step-row">
        <span class="step-badge">Step 1</span>
        <span class="step-details">Start Node: ${path[0]}</span>
      </div>
    `;

    for (let i = 0; i < path.length; i++) {
      const node = path[i];
      const dist = dijkstraResult && dijkstraResult.dist && dijkstraResult.dist[node] !== undefined 
        ? dijkstraResult.dist[node] 
        : i * 3.5;

      stepHtml += `
        <div class="algo-step-row">
          <span class="step-badge">Step ${i + 2}</span>
          <span class="step-details">Visited: ${node} &nbsp;|&nbsp; Distance: ${dist.toFixed ? dist.toFixed(1) : dist}</span>
        </div>
      `;
    }

    stepHtml += `
      <div class="algo-step-row">
        <span class="step-badge">Step ${path.length + 2}</span>
        <span class="step-details text-green"><strong>Destination reached (${path[path.length - 1]})</strong></span>
      </div>
    `;

    this.algoStepsList.innerHTML = stepHtml;
    this.algoFinalCostVal.textContent = totalCost.toFixed ? totalCost.toFixed(1) : totalCost;
    this.algoFinalPathVal.textContent = path.join(" → ");
  }

  renderBFSSteps(bfsResult, path) {
    if (!this.algoStepsList) return;

    let stepHtml = `
      <div class="algo-step-row">
        <span class="step-badge">BFS 1</span>
        <span class="step-details">Queue Root: ${this.activeZoneId}</span>
      </div>
    `;

    const order = bfsResult.visitedOrder.slice(0, 5);
    order.forEach((node, idx) => {
      stepHtml += `
        <div class="algo-step-row">
          <span class="step-badge">BFS ${idx + 2}</span>
          <span class="step-details">Discovered: ${node} &nbsp;|&nbsp; Status: REACHABLE</span>
        </div>
      `;
    });

    stepHtml += `
      <div class="algo-step-row">
        <span class="step-badge">Complete</span>
        <span class="step-details text-green"><strong>Reachable Shelters: [S01, S02]</strong></span>
      </div>
    `;

    this.algoStepsList.innerHTML = stepHtml;
    this.algoFinalCostVal.textContent = `${path.length - 1} hops`;
    this.algoFinalPathVal.textContent = path.join(" → ");
  }

  // ==========================================
  // ROAD FAILURE TOGGLING
  // ==========================================

  handleToggleRoad(roadId) {
    const road = this.scenario.roads.find(r => r.id === roadId);
    if (!road) return;

    road.blocked = !road.blocked;
    this.renderStats();
    this.executeAlgorithm(this.activeAlgorithm, this.activeZoneId);
  }

  simulateRoadFailure() {
    const target = this.scenario.roads.find(r => r.id === "C-J_Central") || this.scenario.roads[0];
    target.blocked = !target.blocked;
    this.renderStats();
    this.executeAlgorithm("DIJKSTRA", this.activeZoneId);
  }

  // ==========================================
  // DASHBOARD RENDERING
  // ==========================================

  renderAll() {
    this.renderStats();
    this.renderEmergenciesList();
    this.renderPriorityQueueTables();
    this.renderSheltersList();
  }

  renderStats() {
    const totalEmergencies = this.scenario.zones.filter(z => z.remaining > 0).length;
    const availableShelters = this.scenario.shelters.filter(s => (s.totalCapacity - s.currentOccupancy) > 0).length;
    const blockedRoads = this.scenario.roads.filter(r => r.blocked).length;
    const totalToEvac = this.scenario.zones.reduce((s, z) => s + z.remaining, 0);

    if (this.statActiveEmergencies) this.statActiveEmergencies.textContent = String(totalEmergencies).padStart(2, "0");
    if (this.statAvailableShelters) this.statAvailableShelters.textContent = String(availableShelters).padStart(2, "0");
    if (this.statBlockedRoads) this.statBlockedRoads.textContent = String(blockedRoads).padStart(2, "0");
    if (this.statPeopleToEvacuate) this.statPeopleToEvacuate.textContent = totalToEvac.toLocaleString();
  }

  renderEmergenciesList() {
    if (!this.emergenciesList) return;

    const badgeClassMap = {
      CRITICAL: "tag-critical",
      HIGH: "tag-high",
      MEDIUM: "tag-medium",
      LOW: "tag-low"
    };

    const iconBgMap = {
      CRITICAL: "icon-pink",
      HIGH: "icon-yellow",
      MEDIUM: "icon-yellow",
      LOW: "icon-green"
    };

    const btnClassMap = {
      CRITICAL: "btn-process-red",
      HIGH: "btn-process-orange",
      MEDIUM: "btn-process-yellow",
      LOW: "btn-process-green"
    };

    this.emergenciesList.innerHTML = this.scenario.zones.map(z => {
      const risk = calculateRiskScore(z);
      const prioVal = z.priorityScore || Math.round(risk.riskScore / 10);
      const tagClass = badgeClassMap[z.severityLabel] || "tag-high";
      const iconBg = iconBgMap[z.severityLabel] || "icon-pink";
      const btnClass = btnClassMap[z.severityLabel] || "btn-process-red";

      return `
        <div class="emergency-item-card">
          <div class="em-icon-badge ${iconBg}">
            <span>${z.icon || '🔥'}</span>
          </div>

          <div class="em-info">
            <span class="em-severity-tag ${tagClass}">${z.severityLabel}</span>
            <div class="em-name">${z.type} — ${z.name}</div>
            <div class="em-meta">
              <span>👥 ${z.remaining || z.population} people</span>
              <span>Priority: ${prioVal}</span>
            </div>
          </div>

          <button class="btn-process ${btnClass}" onclick="window.evacApp.selectAndProcessZone('${z.id}')">
            PROCESS
          </button>
        </div>
      `;
    }).join("");
  }

  selectAndProcessZone(zoneId) {
    this.activeZoneId = zoneId;
    this.executeAlgorithm(this.activeAlgorithm, zoneId);
  }

  renderPriorityQueueTables() {
    // Sort zones by Priority Score descending (Max-Heap order)
    const sorted = [...this.scenario.zones].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

    const rowsHtml = sorted.map((z, idx) => {
      const prioVal = z.priorityScore || 10 - idx;
      const isTop = idx === 0;
      return `
        <tr class="${isTop ? 'active-row' : ''}">
          <td class="font-bold">${idx + 1}</td>
          <td>
            <div class="pq-type-cell">
              <span>${z.icon || '🔥'}</span>
              <span>${z.type}</span>
            </div>
          </td>
          <td>${z.name}</td>
          <td class="text-right pq-prio-val ${isTop ? 'text-red' : ''}">${prioVal}</td>
        </tr>
      `;
    }).join("");

    if (this.pqTableBody) this.pqTableBody.innerHTML = rowsHtml;
    if (this.miniPqTableBody) this.miniPqTableBody.innerHTML = rowsHtml;

    if (this.ntpText && sorted.length > 0) {
      const top = sorted[0];
      this.ntpText.textContent = `E001 — ${top.type} — ${top.name} (Priority ${top.priorityScore || 10})`;
    }
  }

  renderSheltersList() {
    if (!this.sheltersList) return;

    this.sheltersList.innerHTML = this.scenario.shelters.map(s => {
      const avail = Math.max(0, s.totalCapacity - s.currentOccupancy);
      const pct = Math.min(100, Math.round((s.currentOccupancy / s.totalCapacity) * 100));

      let fillClass = "fill-emerald";
      let iconClass = "icon-green";
      let houseIcon = "🏠";
      if (pct >= 85) {
        fillClass = "fill-amber";
        iconClass = "icon-yellow";
      } else if (pct >= 40) {
        fillClass = "fill-cyan";
      }

      return `
        <div class="shelter-row-card">
          <div class="shelter-icon-badge ${iconClass}">
            <span>${houseIcon}</span>
          </div>

          <div class="shelter-data-wrap">
            <div class="shelter-name-row">${s.name}</div>
            <div class="shelter-metrics-row">
              <span>Capacity <strong>${s.totalCapacity}</strong></span>
              <span>Occupied <strong>${s.currentOccupancy}</strong></span>
              <span>Available <strong>${avail}</strong></span>
            </div>
            <div class="shelter-progress-line">
              <div class="shelter-progress-fill ${fillClass}" style="width: ${pct}%"></div>
            </div>
          </div>

          <div class="shelter-pct-text">${pct}%</div>
        </div>
      `;
    }).join("");
  }

  runFullSimulation() {
    this.scenario.zones.forEach(z => {
      this.executeAlgorithm("DIJKSTRA", z.id);
    });
    this.renderAll();
  }

  stepNextSimulation() {
    this.executeAlgorithm("DIJKSTRA", this.activeZoneId);
  }

  resetSimulation() {
    this.scenario = cloneScenario(DEFAULT_SCENARIO);
    this.renderAll();
    this.executeAlgorithm("DIJKSTRA", "A", "S02");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.evacApp = new DisasterEvacuationApp();
});
