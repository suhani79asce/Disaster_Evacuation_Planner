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
    this.algoDetailBox = document.getElementById("algoDetailBox");
    this.algoDetailTitle = document.getElementById("algoDetailTitle");
    this.algoDetailContent = document.getElementById("algoDetailContent");
    this.algoCostLabel = document.getElementById("algoCostLabel");
    this.algoFinalCostVal = document.getElementById("algoFinalCostVal");
    this.algoPathLabel = document.getElementById("algoPathLabel");
    this.algoFinalPathVal = document.getElementById("algoFinalPathVal");

    // Algorithm Comparison Elements
    this.cmpPqZone = document.getElementById("cmpPqZone");
    this.cmpPqScore = document.getElementById("cmpPqScore");
    this.cmpBfsCount = document.getElementById("cmpBfsCount");
    this.cmpBfsHops = document.getElementById("cmpBfsHops");
    this.cmpDijkstraShelter = document.getElementById("cmpDijkstraShelter");
    this.cmpDijkstraCost = document.getElementById("cmpDijkstraCost");

    // Why This Decision? Elements
    this.whyZoneTitle = document.getElementById("whyZoneTitle");
    this.whyThreatVal = document.getElementById("whyThreatVal");
    this.whyPopFactorVal = document.getElementById("whyPopFactorVal");
    this.whyUrgencyVal = document.getElementById("whyUrgencyVal");
    this.whyVulnerabilityVal = document.getElementById("whyVulnerabilityVal");
    this.whyPriorityScoreVal = document.getElementById("whyPriorityScoreVal");
    this.whyZoneNarrative = document.getElementById("whyZoneNarrative");
    this.whyShelterTitle = document.getElementById("whyShelterTitle");
    this.whyShelterAuditList = document.getElementById("whyShelterAuditList");
    this.whyShelterNarrative = document.getElementById("whyShelterNarrative");

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
    if (this.simPresetSelect) {
      this.simPresetSelect.addEventListener("change", (e) => {
        const presetKey = e.target.value;
        if (PRESETS[presetKey]) {
          this.scenario = cloneScenario({ ...PRESETS[presetKey], nodePositions: NODE_POSITIONS });
          this.renderAll();
          this.executeAlgorithm("DIJKSTRA", this.scenario.zones[0].id);
        }
      });
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
      this.visualizerSubhead.textContent = `Dijkstra Route Execution (Zone ${this.activeZoneId})`;
      if (this.algoCostLabel) this.algoCostLabel.textContent = "Final Route Cost";
      if (this.algoPathLabel) this.algoPathLabel.textContent = "Reconstructed Path";
    } else {
      this.btnTabBFS.classList.add("active");
      this.btnTabDijkstra.classList.remove("active");
      this.visualizerSubhead.textContent = `BFS Reachability Execution (Zone ${this.activeZoneId})`;
      if (this.algoCostLabel) this.algoCostLabel.textContent = "Minimum Hops";
      if (this.algoPathLabel) this.algoPathLabel.textContent = "Nearest Shelter";
    }
  }

  // ==========================================
  // CORE DAA ALGORITHM EXECUTION PIPELINE
  // ==========================================

  executeAlgorithm(algoType, zoneId = "A", preferredShelterId = null) {
    const zone = this.scenario.zones.find(z => z.id === zoneId) || this.scenario.zones[0];
    this.activeZoneId = zone.id;

    const allNodeIds = Object.keys(this.scenario.nodePositions);
    const graph = buildGraph(this.scenario.roads, allNodeIds);

    const blockedCount = this.scenario.roads.filter(r => r.blocked || r.status === "blocked").length;
    if (this.routeBlockedVal) this.routeBlockedVal.textContent = blockedCount;

    // Run the complete integrated DAA evaluation pipeline:
    // Priority Queue -> BFS Reachability -> Shelter Capacity Validation -> Dijkstra Min-Cost Route
    const evaluation = evaluateZoneShelterOptions(zone, this.scenario.shelters, graph, this.scenario.zones);
    const best = evaluation.bestOption;

    // Update Comparison and "Why This Decision?" panels with live calculated data
    this.renderAlgorithmComparison(evaluation, zone);
    this.renderWhyThisDecision(evaluation, zone);
    this.renderSheltersList(evaluation);

    if (algoType === "BFS") {
      // 1. BFS Execution Mode
      const bfsResult = evaluation.bfs;
      this.map.setBfsVisited(Array.from(bfsResult.reachableNodes));

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
      if (this.routeEmergencyVal) this.routeEmergencyVal.textContent = `${zone.type} — ${zone.name}`;
      if (this.routeDestinationVal) this.routeDestinationVal.textContent = targetShelter ? targetShelter.name : "None Reachable";
      if (this.routeAlgorithmVal) this.routeAlgorithmVal.textContent = "BFS (HOP-COUNT)";
      if (this.routeDistVal) this.routeDistVal.textContent = `${path.length * 2.5} km`;
      if (this.routeCostVal) this.routeCostVal.textContent = `${Math.max(0, path.length - 1)} hops`;
      if (this.routeTimeVal) this.routeTimeVal.textContent = `${(path.length - 1) * 3} min`;
      if (this.routePathSequence) this.routePathSequence.textContent = path.join(" → ") || "No open route";

      // Render Visualizer for BFS
      this.renderBFSSteps(bfsResult, path, targetShelter);

    } else {
      // 2. Dijkstra Execution Mode
      if (best) {
        this.activeShelterId = best.shelter.id;
        this.map.setBfsVisited(Array.from(evaluation.bfs.reachableNodes));
        this.map.setActiveRoute(best.path, zone.id, best.shelter.id);
        this.map.render(this.scenario);

        // Update UI Route Information
        if (this.routeEmergencyVal) this.routeEmergencyVal.textContent = `${zone.type} — ${zone.name}`;
        if (this.routeDestinationVal) this.routeDestinationVal.textContent = best.shelter.name;
        if (this.routeAlgorithmVal) this.routeAlgorithmVal.textContent = "DIJKSTRA (MIN-COST)";
        if (this.routeDistVal) this.routeDistVal.textContent = `${best.cost.toFixed(1)} km`;
        if (this.routeCostVal) this.routeCostVal.textContent = `${best.cost.toFixed(1)}`;
        if (this.routeTimeVal) this.routeTimeVal.textContent = `${Math.round(best.cost * 1.5)} min`;
        if (this.routePathSequence) this.routePathSequence.textContent = best.path.join(" → ");

        // Render Visualizer for Dijkstra
        this.renderDijkstraSteps(best.dijkstraResult, best.path, best.cost, zone.id, best.shelter.id);
      } else {
        this.map.setActiveRoute([], zone.id, null);
        this.map.render(this.scenario);

        if (this.routePathSequence) this.routePathSequence.textContent = "⚠ NO FEASIBLE ROUTE AVAILABLE";
        if (this.algoStepsList) {
          this.algoStepsList.innerHTML = `<div class="algo-step-row text-red"><strong>Failure:</strong> No capacity-feasible shelter is reachable from ${zone.name} via open roads.</div>`;
        }
        if (this.algoDetailContent) {
          this.algoDetailContent.innerHTML = `<div class="text-red font-mono" style="padding: 6px;">All candidate shelters are either unreachable (BFS: no open path) or rejected due to capacity limits.</div>`;
        }
        if (this.algoFinalCostVal) this.algoFinalCostVal.textContent = "∞";
        if (this.algoFinalPathVal) this.algoFinalPathVal.textContent = "None";
      }
    }
  }

  // ==========================================
  // ALGORITHM COMPARISON & LIVE METRICS
  // ==========================================

  renderAlgorithmComparison(evaluation, zone) {
    if (this.cmpPqZone) this.cmpPqZone.textContent = zone.name;
    if (this.cmpPqScore) this.cmpPqScore.textContent = `Score: ${evaluation.priority_score.toFixed(1)}`;

    const rShelters = evaluation.bfs.reachableShelters || [];
    if (this.cmpBfsCount) this.cmpBfsCount.textContent = `${rShelters.length} Shelters`;
    if (this.cmpBfsHops) {
      this.cmpBfsHops.textContent = evaluation.bfs.minimumHopShelter 
        ? `Min Hops: ${evaluation.bfs.minimumHops} (${evaluation.bfs.minimumHopShelter})`
        : "None Reachable";
    }

    const best = evaluation.bestOption;
    if (this.cmpDijkstraShelter) {
      this.cmpDijkstraShelter.textContent = best ? best.shelter.name : "None Feasible";
    }
    if (this.cmpDijkstraCost) {
      this.cmpDijkstraCost.textContent = best ? `Cost: ${best.cost.toFixed(1)} km` : "Cost: ∞";
    }
  }

  // ==========================================
  // WHY THIS DECISION? EXPLANATION PANEL
  // ==========================================

  renderWhyThisDecision(evaluation, zone) {
    const bd = evaluation.priority_breakdown;
    if (this.whyZoneTitle) this.whyZoneTitle.textContent = `${zone.name} Selection`;
    if (this.whyThreatVal) this.whyThreatVal.textContent = `${bd.threat} / 100`;
    if (this.whyPopFactorVal) this.whyPopFactorVal.textContent = `${bd.population_factor} / 100`;
    if (this.whyUrgencyVal) this.whyUrgencyVal.textContent = `${bd.urgency} / 100`;
    if (this.whyVulnerabilityVal) this.whyVulnerabilityVal.textContent = `${bd.vulnerability} / 100`;
    if (this.whyPriorityScoreVal) this.whyPriorityScoreVal.textContent = `${evaluation.priority_score.toFixed(1)} / 100`;
    if (this.whyZoneNarrative) this.whyZoneNarrative.textContent = evaluation.explanation.why_zone_prioritized;

    const best = evaluation.bestOption;
    if (this.whyShelterTitle) {
      this.whyShelterTitle.textContent = best ? `${best.shelter.name} Selection` : "No Feasible Shelter";
    }
    if (this.whyShelterNarrative) {
      this.whyShelterNarrative.textContent = evaluation.explanation.why_shelter_selected;
    }

    if (this.whyShelterAuditList) {
      const auditHtml = Object.values(evaluation.shelters).map(s => {
        const isFeas = s.feasible;
        const statusClass = isFeas ? "feasible" : "rejected";
        const badgeClass = isFeas ? "badge-feasible" : (s.reachable ? "badge-rejected" : "badge-unreachable");
        const statusLabel = isFeas ? "FEASIBLE" : (s.reachable ? "REJECTED: CAPACITY" : "UNREACHABLE");

        return `
          <div class="audit-shelter-row ${statusClass}">
            <div class="audit-shelter-info">
              <span class="audit-status-badge ${badgeClass}">${statusLabel}</span>
              <strong>${s.name}</strong>
              <span class="text-muted">(Avail: ${s.available_capacity} | Req: ${s.required_population})</span>
            </div>
            <div class="font-mono text-dim">
              ${s.reason}
            </div>
          </div>
        `;
      }).join("");

      this.whyShelterAuditList.innerHTML = auditHtml;
    }
  }

  // ==========================================
  // DIJKSTRA STEP-BY-STEP VISUALIZER
  // ==========================================

  renderDijkstraSteps(dijkstraResult, path, totalCost, startNode, targetNode) {
    if (!this.algoStepsList) return;

    let stepHtml = `
      <div class="algo-step-row">
        <span class="step-badge">Start</span>
        <span class="step-details">Root: Zone ${startNode} (Cost: 0.0)</span>
      </div>
    `;

    const visited = dijkstraResult.visitedOrder || path;
    visited.slice(0, 6).forEach((node, idx) => {
      const costVal = dijkstraResult.dist && dijkstraResult.dist[node] !== undefined 
        ? dijkstraResult.dist[node].toFixed(1)
        : idx * 3.5;
      const isFinal = path.includes(node);

      stepHtml += `
        <div class="algo-step-row">
          <span class="step-badge">Visit ${idx + 1}</span>
          <span class="step-details font-mono">
            Node: <strong>${node}</strong> &nbsp;|&nbsp; Tentative: <strong>${costVal}</strong>
            ${isFinal ? ' <span class="text-green font-bold">✔ On Path</span>' : ''}
          </span>
        </div>
      `;
    });

    stepHtml += `
      <div class="algo-step-row">
        <span class="step-badge">Goal</span>
        <span class="step-details text-green"><strong>Target ${targetNode} reached with cost ${totalCost.toFixed(1)} km</strong></span>
      </div>
    `;

    this.algoStepsList.innerHTML = stepHtml;

    // Render Tentative Costs Table in Detail Box
    if (this.algoDetailContent && dijkstraResult.dist) {
      if (this.algoDetailTitle) this.algoDetailTitle.textContent = "Dijkstra Tentative Costs & Relaxation Table";
      
      let tableHtml = `
        <table class="tentative-cost-table">
          <thead>
            <tr>
              <th>Node</th>
              <th>Tentative Cost</th>
              <th>Predecessor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
      `;

      Object.keys(dijkstraResult.dist).forEach(node => {
        const c = dijkstraResult.dist[node];
        const prev = dijkstraResult.prev[node] || "-";
        const isExplored = dijkstraResult.visitedOrder.includes(node);
        const costStr = c === Infinity ? "∞" : c.toFixed(1) + " km";

        tableHtml += `
          <tr>
            <td><strong>${node}</strong></td>
            <td>${costStr}</td>
            <td>${prev}</td>
            <td>${isExplored ? '<span class="text-green">Explored</span>' : '<span class="text-dim">Pending</span>'}</td>
          </tr>
        `;
      });

      tableHtml += `</tbody></table>`;
      this.algoDetailContent.innerHTML = tableHtml;
    }

    if (this.algoFinalCostVal) this.algoFinalCostVal.textContent = `${totalCost.toFixed(1)} km`;
    if (this.algoFinalPathVal) this.algoFinalPathVal.textContent = path.join(" → ");
  }

  // ==========================================
  // BFS STEP-BY-STEP VISUALIZER
  // ==========================================

  renderBFSSteps(bfsResult, path, targetShelter) {
    if (!this.algoStepsList) return;

    let stepHtml = `
      <div class="algo-step-row">
        <span class="step-badge">BFS Root</span>
        <span class="step-details">Queue Initialization: Zone ${this.activeZoneId}</span>
      </div>
    `;

    // Render Level-by-Level breakdown
    const levels = bfsResult.levels || {};
    Object.keys(levels).forEach(lvl => {
      const nodes = levels[lvl];
      stepHtml += `
        <div class="algo-step-row">
          <span class="step-badge">Level ${lvl}</span>
          <span class="step-details font-mono">[${nodes.join(", ")}]</span>
        </div>
      `;
    });

    stepHtml += `
      <div class="algo-step-row">
        <span class="step-badge">Result</span>
        <span class="step-details text-green">
          <strong>Reachable Shelters: [${bfsResult.reachableShelters.map(s => s.id).join(", ") || 'None'}]</strong>
        </span>
      </div>
    `;

    this.algoStepsList.innerHTML = stepHtml;

    // Render Reachability Details in Detail Box
    if (this.algoDetailContent) {
      if (this.algoDetailTitle) this.algoDetailTitle.textContent = "BFS Reachability & Minimum Hop Inspector";

      let detailHtml = `
        <div class="bfs-level-group">
      `;

      Object.keys(levels).forEach(lvl => {
        detailHtml += `
          <div class="bfs-level-row">
            <span class="bfs-lvl-badge">Level ${lvl}</span>
            <span class="bfs-lvl-nodes">${levels[lvl].join(" &nbsp;•&nbsp; ")}</span>
          </div>
        `;
      });

      detailHtml += `
        </div>
        <div style="margin-top: 8px; font-size: 0.72rem; padding: 6px; background: #ffffff; border-radius: 4px; border: 1px dashed #cbd5e1;">
          <strong>Minimum Hop Shelter:</strong> <span class="text-blue font-bold">${bfsResult.minimumHopShelter || 'None'}</span>
          &nbsp;|&nbsp; <strong>Hops:</strong> ${bfsResult.minimumHops !== Infinity ? bfsResult.minimumHops : 'N/A'}
        </div>
      `;

      this.algoDetailContent.innerHTML = detailHtml;
    }

    if (this.algoFinalCostVal) this.algoFinalCostVal.textContent = `${Math.max(0, path.length - 1)} hops`;
    if (this.algoFinalPathVal) this.algoFinalPathVal.textContent = targetShelter ? `${targetShelter.name}` : "None";
  }

  // ==========================================
  // ROAD FAILURE TOGGLING
  // ==========================================

  handleToggleRoad(roadId) {
    const road = this.scenario.roads.find(r => r.id === roadId);
    if (!road) return;

    road.blocked = !road.blocked;
    road.status = road.blocked ? "blocked" : "open";
    this.renderStats();
    this.executeAlgorithm(this.activeAlgorithm, this.activeZoneId);
  }

  simulateRoadFailure() {
    const target = this.scenario.roads.find(r => r.id === "C-J_Central") || this.scenario.roads[0];
    target.blocked = !target.blocked;
    target.status = target.blocked ? "blocked" : "open";
    this.renderStats();
    this.executeAlgorithm(this.activeAlgorithm, this.activeZoneId);
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
    const blockedRoads = this.scenario.roads.filter(r => r.blocked || r.status === "blocked").length;
    const totalToEvac = this.scenario.zones.reduce((s, z) => s + (z.remaining !== undefined ? z.remaining : z.population), 0);

    if (this.statActiveEmergencies) this.statActiveEmergencies.textContent = String(totalEmergencies).padStart(2, "0");
    if (this.statAvailableShelters) this.statAvailableShelters.textContent = String(availableShelters).padStart(2, "0");
    if (this.statBlockedRoads) this.statBlockedRoads.textContent = String(blockedRoads).padStart(2, "0");
    if (this.statPeopleToEvacuate) this.statPeopleToEvacuate.textContent = totalToEvac.toLocaleString();
  }

  renderEmergenciesList() {
    if (!this.emergenciesList) return;

    const maxPop = Math.max(...this.scenario.zones.map(z => Number(z.population) || 0), 100);

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
      const risk = calculateRiskScore(z, maxPop);
      const prioVal = risk.riskScore.toFixed(1);
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
              <span>Priority Score: <strong>${prioVal}</strong></span>
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
    const maxPop = Math.max(...this.scenario.zones.map(z => Number(z.population) || 0), 100);

    // Build MaxHeap with deterministic tie-breaking
    const maxHeap = new MaxHeap();
    this.scenario.zones.forEach(z => {
      const scoreData = calculateRiskScore(z, maxPop);
      maxHeap.insert({
        ...z,
        priorityScore: scoreData.riskScore,
        riskScore: scoreData.riskScore
      });
    });

    const sorted = [];
    while (!maxHeap.isEmpty()) {
      sorted.push(maxHeap.extractMax());
    }

    const rowsHtml = sorted.map((z, idx) => {
      const prioVal = z.priorityScore.toFixed(1);
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
      this.ntpText.textContent = `E001 — ${top.type} — ${top.name} (Priority ${top.priorityScore.toFixed(1)})`;
    }
  }

  renderSheltersList(evaluation = null) {
    if (!this.sheltersList) return;

    const activeZone = this.scenario.zones.find(z => z.id === this.activeZoneId) || this.scenario.zones[0];
    const reqPop = activeZone.remaining !== undefined ? activeZone.remaining : activeZone.population;

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

      // Check capacity feasibility relative to active danger zone
      const audit = evaluation && evaluation.shelters ? evaluation.shelters[s.id] : null;
      let statusBadge = "";
      if (audit) {
        if (audit.feasible) {
          statusBadge = `<span class="audit-status-badge badge-feasible">FEASIBLE</span>`;
        } else if (!audit.reachable) {
          statusBadge = `<span class="audit-status-badge badge-unreachable">UNREACHABLE</span>`;
        } else {
          statusBadge = `<span class="audit-status-badge badge-rejected" title="${audit.reason}">INSUFFICIENT</span>`;
        }
      } else {
        const hasCap = avail >= reqPop;
        statusBadge = hasCap 
          ? `<span class="audit-status-badge badge-feasible">FEASIBLE</span>`
          : `<span class="audit-status-badge badge-rejected">INSUFFICIENT</span>`;
      }

      return `
        <div class="shelter-row-card">
          <div class="shelter-icon-badge ${iconClass}">
            <span>${houseIcon}</span>
          </div>

          <div class="shelter-data-wrap">
            <div class="shelter-name-row" style="display: flex; justify-content: space-between; align-items: center;">
              <span>${s.name}</span>
              ${statusBadge}
            </div>
            <div class="shelter-metrics-row">
              <span>Cap <strong>${s.totalCapacity}</strong></span>
              <span>Occ <strong>${s.currentOccupancy}</strong></span>
              <span>Avail <strong>${avail}</strong></span>
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
