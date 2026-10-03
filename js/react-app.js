/**
 * Disaster Evacuation Planner - React 18 Application
 * Technologies: React 18, Leaflet, Flask REST API / Pure DAA Engine
 */

const { useState, useEffect, useRef, useCallback, createElement: h } = React;

function App() {
  const [scenario, setScenario] = useState(() => cloneScenario(DEFAULT_SCENARIO));
  const [activeZoneId, setActiveZoneId] = useState("A");
  const [activeShelterId, setActiveShelterId] = useState("S02");
  const [activeAlgorithm, setActiveAlgorithm] = useState("DIJKSTRA");
  const [evaluation, setEvaluation] = useState(null);
  const [systemTime, setSystemTime] = useState("");
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [simLogs, setSimLogs] = useState([]);
  
  const mapInstanceRef = useRef(null);

  // Clock interval
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setSystemTime(d.toTimeString().split(" ")[0]);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute DAA evaluation whenever scenario or activeZoneId changes
  useEffect(() => {
    const zone = scenario.zones.find(z => z.id === activeZoneId) || scenario.zones[0];
    const allNodeIds = Object.keys(scenario.nodePositions);
    const graph = buildGraph(scenario.roads, allNodeIds);
    const evalResult = evaluateZoneShelterOptions(zone, scenario.shelters, graph, scenario.zones);
    setEvaluation(evalResult);
  }, [scenario, activeZoneId]);

  // Update map when evaluation or activeAlgorithm changes
  useEffect(() => {
    if (!mapInstanceRef.current || !evaluation) return;

    const map = mapInstanceRef.current;
    const zone = scenario.zones.find(z => z.id === activeZoneId) || scenario.zones[0];

    if (activeAlgorithm === "BFS") {
      const reachableShelters = scenario.shelters.filter(s => evaluation.bfs.reachableNodes.has(s.id));
      const target = reachableShelters.find(s => s.id === activeShelterId) || reachableShelters[0];
      const path = target ? reconstructPath(evaluation.bfs.parentMap, zone.id, target.id) : [];

      map.setBfsVisited(Array.from(evaluation.bfs.reachableNodes));
      map.setActiveRoute(path, zone.id, target ? target.id : null);
      map.render(scenario);
    } else {
      const best = evaluation.bestOption;
      map.setBfsVisited(Array.from(evaluation.bfs.reachableNodes));
      if (best) {
        map.setActiveRoute(best.path, zone.id, best.shelter.id);
      } else {
        map.setActiveRoute([], zone.id, null);
      }
      map.render(scenario);
    }
  }, [evaluation, activeAlgorithm, activeShelterId, scenario, activeZoneId]);

  // Handle toggling road blocked state
  const handleToggleRoad = useCallback((roadId) => {
    setScenario(prev => {
      const next = cloneScenario(prev);
      const road = next.roads.find(r => r.id === roadId);
      if (road) {
        road.blocked = !road.blocked;
        road.status = road.blocked ? "blocked" : "open";
      }
      return next;
    });
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new EvacuationMap("reactMapContainer", handleToggleRoad);
    }
  }, [handleToggleRoad]);

  const selectZone = (id) => {
    setActiveZoneId(id);
  };

  const handleSimulateFailure = () => {
    handleToggleRoad("C-J_Central");
  };

  const handleReset = () => {
    setScenario(cloneScenario(DEFAULT_SCENARIO));
    setActiveZoneId("A");
    setActiveShelterId("S02");
    setActiveAlgorithm("DIJKSTRA");
  };

  const handlePresetChange = (presetKey) => {
    if (PRESETS[presetKey]) {
      setScenario(cloneScenario({ ...PRESETS[presetKey], nodePositions: NODE_POSITIONS }));
      setActiveZoneId("A");
    }
  };

  // KPIs
  const totalEmergencies = scenario.zones.filter(z => z.remaining > 0).length;
  const availableShelters = scenario.shelters.filter(s => (s.totalCapacity - s.currentOccupancy) > 0).length;
  const blockedRoadsCount = scenario.roads.filter(r => r.blocked || r.status === "blocked").length;
  const totalPeopleAtRisk = scenario.zones.reduce((s, z) => s + (z.remaining !== undefined ? z.remaining : z.population), 0);

  // Active zone and path for UI
  const currentZone = scenario.zones.find(z => z.id === activeZoneId) || scenario.zones[0];
  const bestOption = evaluation ? evaluation.bestOption : null;

  let displayDestination = "Calculating...";
  let displayDist = "0.0 km";
  let displayCost = "0";
  let displayTime = "0 min";
  let displayPath = "None";

  if (activeAlgorithm === "BFS" && evaluation) {
    const reachable = scenario.shelters.filter(s => evaluation.bfs.reachableNodes.has(s.id));
    const target = reachable.find(s => s.id === activeShelterId) || reachable[0];
    const path = target ? reconstructPath(evaluation.bfs.parentMap, currentZone.id, target.id) : [];
    displayDestination = target ? target.name : "None Reachable";
    displayDist = `${(path.length * 2.5).toFixed(1)} km`;
    displayCost = `${Math.max(0, path.length - 1)} hops`;
    displayTime = `${(path.length - 1) * 3} min`;
    displayPath = path.join(" → ") || "No open route";
  } else if (bestOption) {
    displayDestination = bestOption.shelter.name;
    displayDist = `${bestOption.cost.toFixed(1)} km`;
    displayCost = `${bestOption.cost.toFixed(1)}`;
    displayTime = `${Math.round(bestOption.cost * 1.5)} min`;
    displayPath = bestOption.path.join(" → ");
  } else if (evaluation) {
    displayDestination = "None Feasible";
    displayDist = "∞";
    displayCost = "∞";
    displayTime = "N/A";
    displayPath = "⚠ NO FEASIBLE ROUTE AVAILABLE";
  }

  // Priority Queue extraction order
  const maxPop = Math.max(...scenario.zones.map(z => Number(z.population) || 0), 100);
  const pq = new MaxHeap();
  scenario.zones.forEach(z => {
    const sc = calculateRiskScore(z, maxPop);
    pq.insert({ ...z, priorityScore: sc.riskScore });
  });
  const sortedPq = [];
  while (!pq.isEmpty()) {
    sortedPq.push(pq.extractMax());
  }

  return h("div", { className: "app-root-container" },
    // 1. Topbar
    h("header", { className: "app-topbar" },
      h("div", { className: "topbar-left" },
        h("div", { className: "app-logo-shield" },
          h("svg", { viewBox: "0 0 24 24", width: 22, height: 22, fill: "none", stroke: "#0ea5e9", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" },
            h("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" })
          )
        ),
        h("div", { className: "app-branding" },
          h("h1", { className: "app-title" }, "Disaster Evacuation Planner"),
          h("p", { className: "app-tagline" }, "React + Leaflet + Flask (Python) Edition")
        )
      ),
      h("div", { className: "topbar-center" },
        h("button", { className: "nav-tab-btn active" },
          h("span", { className: "nav-icon" }, "🏠"),
          h("span", null, "Dashboard")
        ),
        h("button", { className: "nav-tab-btn", onClick: () => setIsSimModalOpen(true) },
          h("span", { className: "nav-icon" }, "⚗"),
          h("span", null, "Simulation")
        )
      ),
      h("div", { className: "topbar-right" },
        h("div", { className: "status-indicator" },
          h("span", { className: "status-dot-green" }),
          h("div", { className: "status-meta" },
            h("span", { className: "status-title" }, "System Online"),
            h("span", { className: "status-time" }, `Last Updated: ${systemTime}`)
          )
        ),
        h("div", { className: "user-avatar" },
          h("svg", { viewBox: "0 0 24 24", width: 18, height: 18, fill: "none", stroke: "#475569", strokeWidth: 2 },
            h("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
            h("circle", { cx: 12, cy: 7, r: 4 })
          )
        )
      )
    ),

    // 2. Main Viewport
    h("main", { className: "dashboard-viewport" },
      // KPI Row
      h("section", { className: "top-kpi-row" },
        h("div", { className: "kpi-box kpi-box-pink" },
          h("div", { className: "kpi-icon-wrap icon-pink" }, h("span", null, "🔥")),
          h("div", { className: "kpi-data" },
            h("div", { className: "kpi-heading" }, "Active Emergencies"),
            h("div", { className: "kpi-number" }, String(totalEmergencies).padStart(2, "0")),
            h("div", { className: "kpi-subtext text-pink" }, "Priority Queue Active")
          ),
          h("div", { className: "kpi-arrow" }, "›")
        ),
        h("div", { className: "kpi-box kpi-box-green" },
          h("div", { className: "kpi-icon-wrap icon-green" }, h("span", null, "🏠")),
          h("div", { className: "kpi-data" },
            h("div", { className: "kpi-heading" }, "Available Shelters"),
            h("div", { className: "kpi-number" }, String(availableShelters).padStart(2, "0")),
            h("div", { className: "kpi-subtext text-green" }, "Capacity Verified")
          ),
          h("div", { className: "kpi-arrow" }, "›")
        ),
        h("div", { className: "kpi-box kpi-box-yellow" },
          h("div", { className: "kpi-icon-wrap icon-yellow" }, h("span", null, "🚧")),
          h("div", { className: "kpi-data" },
            h("div", { className: "kpi-heading" }, "Blocked Roads"),
            h("div", { className: "kpi-number" }, String(blockedRoadsCount).padStart(2, "0")),
            h("div", { className: "kpi-subtext text-yellow" }, "Excluded in Graph")
          ),
          h("div", { className: "kpi-arrow" }, "›")
        ),
        h("div", { className: "kpi-box kpi-box-blue" },
          h("div", { className: "kpi-icon-wrap icon-blue" }, h("span", null, "👥")),
          h("div", { className: "kpi-data" },
            h("div", { className: "kpi-heading" }, "People to Evacuate"),
            h("div", { className: "kpi-number" }, totalPeopleAtRisk.toLocaleString()),
            h("div", { className: "kpi-subtext text-blue" }, "Conserved Total")
          ),
          h("div", { className: "kpi-arrow" }, "›")
        )
      ),

      // 3 Columns Grid
      h("div", { className: "main-columns-grid" },
        // LEFT COLUMN
        h("aside", { className: "col-left" },
          // Active Emergencies Card
          h("div", { className: "panel-box" },
            h("div", { className: "panel-head" },
              h("div", { className: "panel-title-wrap" },
                h("span", { className: "panel-icon text-red" }, "🔥"),
                h("h2", { className: "panel-title" }, "Active Emergencies")
              )
            ),
            h("div", { className: "emergencies-list" },
              scenario.zones.map(z => {
                const sc = calculateRiskScore(z, maxPop);
                const isSelected = z.id === activeZoneId;
                return h("div", { key: z.id, className: `emergency-item-card ${isSelected ? 'active-zone-border' : ''}` },
                  h("div", { className: `em-icon-badge icon-pink` }, h("span", null, z.icon || "🔥")),
                  h("div", { className: "em-info" },
                    h("span", { className: `em-severity-tag ${z.severityClass || 'tag-high'}` }, z.severityLabel),
                    h("div", { className: "em-name" }, `${z.type} — ${z.name}`),
                    h("div", { className: "em-meta" },
                      h("span", null, `👥 ${z.remaining || z.population} people`),
                      h("span", null, `Score: ${sc.riskScore.toFixed(1)}`)
                    )
                  ),
                  h("button", {
                    className: "btn-process btn-process-red",
                    onClick: () => selectZone(z.id)
                  }, "PROCESS")
                );
              })
            )
          ),

          // Priority Queue Card
          h("div", { className: "panel-box" },
            h("div", { className: "panel-head" },
              h("div", { className: "panel-title-wrap" },
                h("span", { className: "panel-icon text-red" }, "🚨"),
                h("h2", { className: "panel-title" }, "Priority Queue (Max-Heap)")
              )
            ),
            h("div", { className: "pq-table-wrap" },
              h("table", { className: "pq-table" },
                h("thead", null,
                  h("tr", null,
                    h("th", null, "#"),
                    h("th", null, "Type"),
                    h("th", null, "Zone"),
                    h("th", { className: "text-right" }, "Priority")
                  )
                ),
                h("tbody", null,
                  sortedPq.map((z, idx) => h("tr", { key: z.id, className: idx === 0 ? "active-row" : "" },
                    h("td", { className: "font-bold" }, idx + 1),
                    h("td", null, h("div", { className: "pq-type-cell" }, h("span", null, z.icon || "🔥"), h("span", null, z.type))),
                    h("td", null, z.name),
                    h("td", { className: `text-right pq-prio-val ${idx === 0 ? 'text-red' : ''}` }, z.priorityScore.toFixed(1))
                  ))
                )
              )
            ),
            sortedPq.length > 0 && h("div", { className: "next-to-process-box" },
              h("div", { className: "ntp-label" }, "NEXT TO PROCESS"),
              h("div", { className: "ntp-row" },
                h("span", { className: "ntp-icon" }, sortedPq[0].icon || "🔥"),
                h("span", { className: "ntp-text" }, `E001 — ${sortedPq[0].type} — ${sortedPq[0].name} (Score: ${sortedPq[0].priorityScore.toFixed(1)})`)
              )
            )
          )
        ),

        // MIDDLE COLUMN
        h("section", { className: "col-middle" },
          // Live Map Card
          h("div", { className: "panel-box map-panel" },
            h("div", { className: "map-panel-head" },
              h("h2", { className: "panel-title" }, "Live Map (Hyderabad Metro)"),
              h("div", { className: "map-toolbar" },
                h("button", { className: "map-tool-btn", onClick: () => mapInstanceRef.current && mapInstanceRef.current.map.zoomIn() }, "+"),
                h("button", { className: "map-tool-btn", onClick: () => mapInstanceRef.current && mapInstanceRef.current.map.zoomOut() }, "−"),
                h("button", { className: "map-tool-btn", onClick: () => mapInstanceRef.current && mapInstanceRef.current.map.setView([17.4050, 78.4700], 12) }, "📍")
              )
            ),
            h("div", { className: "live-map-wrapper", id: "reactMapContainer" })
          ),

          // Route Information & Mini PQ
          h("div", { className: "route-details-split" },
            h("div", { className: "panel-box subcard-route" },
              h("div", { className: "panel-head" },
                h("div", { className: "panel-title-wrap" },
                  h("span", { className: "panel-icon text-blue" }, "🗺"),
                  h("h3", { className: "panel-title" }, "Route Information")
                ),
                h("span", { className: bestOption ? "status-pill-green" : "status-pill-red" },
                  bestOption ? "SAFE ROUTE FOUND" : "NO SAFE ROUTE"
                )
              ),
              h("div", { className: "route-meta-row" },
                h("div", { className: "route-meta-item" },
                  h("span", { className: "meta-icon icon-pink" }, currentZone.icon || "🔥"),
                  h("div", null,
                    h("span", { className: "meta-label" }, "Emergency"),
                    h("strong", { className: "meta-val" }, `${currentZone.type} — ${currentZone.name}`)
                  )
                ),
                h("div", { className: "route-meta-item" },
                  h("span", { className: "meta-icon icon-green" }, "🏠"),
                  h("div", null,
                    h("span", { className: "meta-label" }, "Destination"),
                    h("strong", { className: "meta-val" }, displayDestination)
                  )
                ),
                h("div", { className: "route-meta-item" },
                  h("span", { className: "meta-icon icon-blue" }, "⚙"),
                  h("div", null,
                    h("span", { className: "meta-label" }, "Algorithm"),
                    h("strong", { className: "meta-val text-blue" }, activeAlgorithm)
                  )
                )
              ),
              h("div", { className: "route-metrics-strip" },
                h("div", { className: "strip-item" },
                  h("span", { className: "strip-icon" }, "📏"),
                  h("div", null, h("div", { className: "strip-label" }, "Distance"), h("strong", { className: "strip-val" }, displayDist))
                ),
                h("div", { className: "strip-item" },
                  h("span", { className: "strip-icon" }, "⏱"),
                  h("div", null, h("div", { className: "strip-label" }, "Cost"), h("strong", { className: "strip-val" }, displayCost))
                ),
                h("div", { className: "strip-item" },
                  h("span", { className: "strip-icon" }, "🕒"),
                  h("div", null, h("div", { className: "strip-label" }, "Est. Time"), h("strong", { className: "strip-val" }, displayTime))
                ),
                h("div", { className: "strip-item" },
                  h("span", { className: "strip-icon text-yellow" }, "⚠"),
                  h("div", null, h("div", { className: "strip-label" }, "Blocked"), h("strong", { className: "strip-val" }, blockedRoadsCount))
                )
              ),
              h("div", { className: "route-path-box" },
                h("div", { className: "path-title" }, "Route Path"),
                h("div", { className: "path-sequence" }, displayPath)
              ),
              h("div", { className: "route-actions-row" },
                h("button", {
                  className: `btn ${activeAlgorithm === 'DIJKSTRA' ? 'btn-primary-blue' : 'btn-outline-blue'}`,
                  onClick: () => setActiveAlgorithm("DIJKSTRA")
                }, "RUN DIJKSTRA"),
                h("button", {
                  className: `btn ${activeAlgorithm === 'BFS' ? 'btn-primary-blue' : 'btn-outline-blue'}`,
                  onClick: () => setActiveAlgorithm("BFS")
                }, "RUN BFS")
              )
            ),

            // Mini PQ Display
            h("div", { className: "panel-box subcard-pq" },
              h("div", { className: "panel-head" },
                h("div", { className: "panel-title-wrap" },
                  h("span", { className: "panel-icon text-blue" }, "📊"),
                  h("h3", { className: "panel-title" }, "Priority Queue")
                )
              ),
              h("div", { className: "mini-pq-table-wrap" },
                h("table", { className: "pq-table pq-table-compact" },
                  h("thead", null,
                    h("tr", null,
                      h("th", null, "#"),
                      h("th", null, "Type"),
                      h("th", null, "Zone"),
                      h("th", { className: "text-right" }, "Priority")
                    )
                  ),
                  h("tbody", null,
                    sortedPq.slice(0, 4).map((z, idx) => h("tr", { key: z.id, className: idx === 0 ? "active-row" : "" },
                      h("td", { className: "font-bold" }, idx + 1),
                      h("td", null, h("div", { className: "pq-type-cell" }, h("span", null, z.icon || "🔥"), h("span", null, z.type))),
                      h("td", null, z.name),
                      h("td", { className: `text-right pq-prio-val ${idx === 0 ? 'text-red' : ''}` }, z.priorityScore.toFixed(1))
                    ))
                  )
                )
              ),
              h("div", { className: "heap-segmented-bar-wrap" },
                h("div", { className: "heap-bar-blocks" },
                  [...Array(6)].map((_, i) => h("span", { key: i, className: "hbar-block fill-green" }))
                ),
                h("span", { className: "heap-bar-label" }, "Binary Max-Heap Triage")
              )
            )
          ),

          // 3. Algorithm Comparison Card
          h("div", { className: "panel-box algo-comparison-panel" },
            h("div", { className: "panel-head" },
              h("div", { className: "panel-title-wrap" },
                h("span", { className: "panel-icon text-blue" }, "⚖"),
                h("h3", { className: "panel-title" }, "Algorithm Comparison")
              ),
              h("span", { className: "status-pill-blue" }, "DAA Live Analysis")
            ),
            h("div", { className: "comparison-table-wrap" },
              h("table", { className: "comparison-table" },
                h("thead", null,
                  h("tr", null,
                    h("th", null, "Algorithm"),
                    h("th", null, "Purpose"),
                    h("th", null, "Theoretical Output"),
                    h("th", null, "Current Execution Example")
                  )
                ),
                h("tbody", null,
                  h("tr", null,
                    h("td", null, h("strong", { className: "text-red" }, "Priority Queue"), h("br"), h("span", { className: "algo-subtext" }, "Binary Max-Heap")),
                    h("td", null, "Evacuation prioritization"),
                    h("td", null, "Highest-priority zone"),
                    h("td", null,
                      h("div", { className: "live-metric-chip" },
                        h("span", null, "Selected: ", h("strong", null, currentZone.name)),
                        h("span", { className: "chip-score" }, `Score: ${evaluation ? evaluation.priority_score.toFixed(1) : '-'}`)
                      )
                    )
                  ),
                  h("tr", null,
                    h("td", null, h("strong", { className: "text-blue" }, "BFS"), h("br"), h("span", { className: "algo-subtext" }, "Queue Level Order")),
                    h("td", null, "Reachability / minimum hops"),
                    h("td", null, "Reachable shelters + hop count"),
                    h("td", null,
                      h("div", { className: "live-metric-chip" },
                        h("span", null, "Reachable: ", h("strong", null, `${evaluation ? evaluation.bfs.reachable_shelters.length : 0} Shelters`)),
                        h("span", { className: "chip-score" },
                          evaluation && evaluation.bfs.minimum_hop_shelter
                            ? `Min Hops: ${evaluation.bfs.minimum_hops} (${evaluation.bfs.minimum_hop_shelter})`
                            : "None Reachable"
                        )
                      )
                    )
                  ),
                  h("tr", null,
                    h("td", null, h("strong", { className: "text-green" }, "Dijkstra"), h("br"), h("span", { className: "algo-subtext" }, "Binary Min-Heap")),
                    h("td", null, "Minimum-cost routing"),
                    h("td", null, "Best feasible route + total cost"),
                    h("td", null,
                      h("div", { className: "live-metric-chip" },
                        h("span", null, "Shelter: ", h("strong", null, bestOption ? bestOption.shelter.name : "None Feasible")),
                        h("span", { className: "chip-score" }, bestOption ? `Cost: ${bestOption.cost.toFixed(1)} km` : "Cost: ∞")
                      )
                    )
                  )
                )
              )
            )
          ),

          // 4. Why This Decision? Panel
          evaluation && h("div", { className: "panel-box why-decision-panel" },
            h("div", { className: "panel-head" },
              h("div", { className: "panel-title-wrap" },
                h("span", { className: "panel-icon text-yellow" }, "💡"),
                h("h3", { className: "panel-title" }, "Why This Decision?")
              ),
              h("span", { className: "tag-why-badge" }, "Deterministic Decision Engine")
            ),
            h("div", { className: "why-decision-content" },
              // Zone explanation
              h("div", { className: "why-section-card" },
                h("div", { className: "why-section-header" },
                  h("span", { className: "why-tag tag-red" }, "WHY ZONE WAS PRIORITIZED"),
                  h("strong", { className: "why-target-title" }, `${currentZone.name} Selection`)
                ),
                h("div", { className: "why-factors-grid" },
                  h("div", { className: "why-factor-cell" },
                    h("span", { className: "factor-label" }, "Threat Severity (40%)"),
                    h("strong", { className: "factor-val text-red" }, `${evaluation.priority_breakdown.threat} / 100`)
                  ),
                  h("div", { className: "why-factor-cell" },
                    h("span", { className: "factor-label" }, "Population Factor (25%)"),
                    h("strong", { className: "factor-val text-blue" }, `${evaluation.priority_breakdown.population_factor} / 100`)
                  ),
                  h("div", { className: "why-factor-cell" },
                    h("span", { className: "factor-label" }, "Time Urgency (20%)"),
                    h("strong", { className: "factor-val text-yellow" }, `${evaluation.priority_breakdown.urgency} / 100`)
                  ),
                  h("div", { className: "why-factor-cell" },
                    h("span", { className: "factor-label" }, "Vulnerability (15%)"),
                    h("strong", { className: "factor-val text-purple" }, `${evaluation.priority_breakdown.vulnerability} / 100`)
                  )
                ),
                h("div", { className: "why-formula-banner" },
                  h("span", null, "Priority Score = 0.40(Threat) + 0.25(PopFactor) + 0.20(Urgency) + 0.15(Vulnerability)"),
                  h("strong", { className: "text-red" }, `${evaluation.priority_score.toFixed(1)} / 100`)
                ),
                h("div", { className: "why-narrative-text" }, evaluation.explanation.why_zone_prioritized)
              ),

              // Shelter explanation
              h("div", { className: "why-section-card" },
                h("div", { className: "why-section-header" },
                  h("span", { className: "why-tag tag-green" }, "WHY SHELTER WAS SELECTED"),
                  h("strong", { className: "why-target-title" }, bestOption ? `${bestOption.shelter.name} Selection` : "No Feasible Shelter")
                ),
                h("div", { className: "shelter-decision-audit-list" },
                  Object.values(evaluation.shelters).map(s => {
                    const isFeas = s.feasible;
                    const badgeClass = isFeas ? "badge-feasible" : (s.reachable ? "badge-rejected" : "badge-unreachable");
                    const statusLabel = isFeas ? "FEASIBLE" : (s.reachable ? "REJECTED: CAPACITY" : "UNREACHABLE");

                    return h("div", { key: s.id, className: `audit-shelter-row ${isFeas ? 'feasible' : 'rejected'}` },
                      h("div", { className: "audit-shelter-info" },
                        h("span", { className: `audit-status-badge ${badgeClass}` }, statusLabel),
                        h("strong", null, s.name),
                        h("span", { className: "text-muted" }, `(Avail: ${s.available_capacity} | Req: ${s.required_population})`)
                      ),
                      h("div", { className: "font-mono text-dim" }, s.reason)
                    );
                  })
                ),
                h("div", { className: "why-narrative-text text-green" }, evaluation.explanation.why_shelter_selected)
              )
            )
          )
        ),

        // RIGHT COLUMN
        h("aside", { className: "col-right" },
          // Safe Shelters Card
          h("div", { className: "panel-box" },
            h("div", { className: "panel-head" },
              h("div", { className: "panel-title-wrap" },
                h("span", { className: "panel-icon text-green" }, "🛡"),
                h("h2", { className: "panel-title" }, "Safe Shelters")
              )
            ),
            h("div", { className: "shelters-list" },
              scenario.shelters.map(s => {
                const avail = Math.max(0, s.totalCapacity - s.currentOccupancy);
                const pct = Math.min(100, Math.round((s.currentOccupancy / s.totalCapacity) * 100));
                const audit = evaluation && evaluation.shelters ? evaluation.shelters[s.id] : null;

                let statusBadge = null;
                if (audit) {
                  if (audit.feasible) {
                    statusBadge = h("span", { className: "audit-status-badge badge-feasible" }, "FEASIBLE");
                  } else if (!audit.reachable) {
                    statusBadge = h("span", { className: "audit-status-badge badge-unreachable" }, "UNREACHABLE");
                  } else {
                    statusBadge = h("span", { className: "audit-status-badge badge-rejected" }, "INSUFFICIENT");
                  }
                }

                return h("div", { key: s.id, className: "shelter-row-card" },
                  h("div", { className: "shelter-icon-badge icon-green" }, h("span", null, "🏠")),
                  h("div", { className: "shelter-data-wrap" },
                    h("div", { className: "shelter-name-row", style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
                      h("span", null, s.name),
                      statusBadge
                    ),
                    h("div", { className: "shelter-metrics-row" },
                      h("span", null, "Cap ", h("strong", null, s.totalCapacity)),
                      h("span", null, "Occ ", h("strong", null, s.currentOccupancy)),
                      h("span", null, "Avail ", h("strong", null, avail))
                    ),
                    h("div", { className: "shelter-progress-line" },
                      h("div", { className: "shelter-progress-fill fill-emerald", style: { width: `${pct}%` } })
                    )
                  ),
                  h("div", { className: "shelter-pct-text" }, `${pct}%`)
                );
              })
            )
          ),

          // Algorithm Visualizer Card
          h("div", { className: "panel-box visualizer-box" },
            h("div", { className: "panel-head" },
              h("div", { className: "panel-title-wrap" },
                h("span", { className: "panel-icon text-purple" }, "🧠"),
                h("h2", { className: "panel-title" }, "Algorithm Visualizer")
              )
            ),
            h("div", { className: "algo-toggle-switch" },
              h("button", {
                className: `switch-btn ${activeAlgorithm === 'BFS' ? 'active' : ''}`,
                onClick: () => setActiveAlgorithm("BFS")
              }, "BFS"),
              h("button", {
                className: `switch-btn ${activeAlgorithm === 'DIJKSTRA' ? 'active' : ''}`,
                onClick: () => setActiveAlgorithm("DIJKSTRA")
              }, "DIJKSTRA")
            ),
            h("div", { className: "visualizer-subhead" },
              activeAlgorithm === "BFS"
                ? `BFS Reachability Execution (Zone ${activeZoneId})`
                : `Dijkstra Route Execution (Zone ${activeZoneId})`
            ),

            // Execution Steps / Levels
            h("div", { className: "algo-steps-list" },
              activeAlgorithm === "BFS" && evaluation
                ? Object.keys(evaluation.bfs.levels).map(lvl => h("div", { key: lvl, className: "algo-step-row" },
                    h("span", { className: "step-badge" }, `Level ${lvl}`),
                    h("span", { className: "step-details font-mono" }, `[${evaluation.bfs.levels[lvl].join(", ")}]`)
                  ))
                : bestOption
                  ? bestOption.dijkstraResult.visitedOrder.slice(0, 5).map((node, i) => h("div", { key: node, className: "algo-step-row" },
                      h("span", { className: "step-badge" }, `Visit ${i + 1}`),
                      h("span", { className: "step-details font-mono" },
                        `Node: `, h("strong", null, node),
                        ` | Cost: `, h("strong", null, (bestOption.dijkstraResult.dist[node] || 0).toFixed(1)),
                        bestOption.path.includes(node) ? h("span", { className: "text-green font-bold" }, " ✔ On Path") : ""
                      )
                    ))
                  : h("div", { className: "algo-step-row text-red" }, "No feasible path.")
            ),

            // Detailed box: Tentative costs or Level inspector
            h("div", { className: "algo-detail-box" },
              h("div", { className: "algo-detail-title" },
                activeAlgorithm === "BFS" ? "BFS Reachable Shelters & Hops" : "Dijkstra Tentative Costs Table"
              ),
              h("div", { className: "algo-detail-content" },
                activeAlgorithm === "BFS" && evaluation
                  ? h("div", { className: "bfs-level-group" },
                      Object.keys(evaluation.bfs.levels).map(lvl => h("div", { key: lvl, className: "bfs-level-row" },
                        h("span", { className: "bfs-lvl-badge" }, `Level ${lvl}`),
                        h("span", { className: "bfs-lvl-nodes" }, evaluation.bfs.levels[lvl].join(" • "))
                      )),
                      h("div", { style: { marginTop: 6, fontSize: "0.72rem", padding: "6px", background: "#ffffff", borderRadius: 4, border: "1px dashed #cbd5e1" } },
                        h("strong", null, "Min Hop Shelter: "),
                        h("span", { className: "text-blue font-bold" }, evaluation.bfs.minimum_hop_shelter || "None"),
                        h("span", null, ` | Hops: ${evaluation.bfs.minimum_hops || 'N/A'}`)
                      )
                    )
                  : bestOption && bestOption.dijkstraResult
                    ? h("table", { className: "tentative-cost-table" },
                        h("thead", null,
                          h("tr", null,
                            h("th", null, "Node"),
                            h("th", null, "Cost"),
                            h("th", null, "Prev"),
                            h("th", null, "Status")
                          )
                        ),
                        h("tbody", null,
                          Object.keys(bestOption.dijkstraResult.dist).slice(0, 6).map(node => {
                            const c = bestOption.dijkstraResult.dist[node];
                            const prev = bestOption.dijkstraResult.prev[node] || "-";
                            const isVisited = bestOption.dijkstraResult.visitedOrder.includes(node);
                            return h("tr", { key: node },
                              h("td", null, h("strong", null, node)),
                              h("td", null, c === Infinity ? "∞" : `${c.toFixed(1)} km`),
                              h("td", null, prev),
                              h("td", null, isVisited ? h("span", { className: "text-green" }, "Explored") : h("span", { className: "text-dim" }, "Pending"))
                            );
                          })
                        )
                      )
                    : h("div", { className: "text-dim font-mono" }, "Awaiting execution.")
              )
            ),

            // Summary Badges
            h("div", { className: "algo-results-strip" },
              h("div", { className: "res-box" },
                h("span", { className: "res-label" }, activeAlgorithm === "BFS" ? "Min Hops" : "Final Cost"),
                h("strong", { className: "res-number" }, activeAlgorithm === "BFS" ? displayCost : (bestOption ? `${bestOption.cost.toFixed(1)} km` : "∞"))
              ),
              h("div", { className: "res-box res-box-grow" },
                h("span", { className: "res-label" }, activeAlgorithm === "BFS" ? "Reachable Shelter" : "Reconstructed Path"),
                h("strong", { className: "res-path" }, displayDestination)
              )
            ),

            // Legend
            h("div", { className: "node-states-legend" },
              h("span", { className: "legend-chip" }, h("span", { className: "chip-dot dot-gray" }), " Unexplored"),
              h("span", { className: "legend-chip" }, h("span", { className: "chip-dot dot-amber" }), " Processing"),
              h("span", { className: "legend-chip" }, h("span", { className: "chip-dot dot-green" }), " Visited"),
              h("span", { className: "legend-chip" }, h("span", { className: "chip-dot dot-cyan" }), " Final Path")
            )
          )
        )
      )
    ),

    // 3. Simulation Modal
    isSimModalOpen && h("div", { className: "modal-backdrop modal-open" },
      h("div", { className: "modal-card" },
        h("div", { className: "modal-header" },
          h("h3", { className: "modal-title" }, "⚗ DAA Simulation Engine & Scenario Controls"),
          h("button", { className: "modal-close", onClick: () => setIsSimModalOpen(false) }, "×")
        ),
        h("div", { className: "modal-body" },
          h("div", { className: "sim-actions-grid" },
            h("div", { className: "sim-card" },
              h("h4", null, "Playback Controls"),
              h("div", { className: "sim-btn-row" },
                h("button", { className: "btn btn-primary-blue", onClick: () => setActiveAlgorithm("DIJKSTRA") }, "▶ Run Evacuation"),
                h("button", { className: "btn btn-danger-pill", onClick: handleSimulateFailure }, "⚠ Simulate Road Failure"),
                h("button", { className: "btn btn-outline-gray", onClick: handleReset }, "↺ Reset")
              )
            ),
            h("div", { className: "sim-card" },
              h("h4", null, "Scenario Presets"),
              h("select", {
                className: "preset-dropdown-full",
                onChange: (e) => handlePresetChange(e.target.value)
              },
                h("option", { value: "standard" }, "1. Standard Hyderabad Demo (Balanced)"),
                h("option", { value: "road_failure" }, "2. Dynamic Road Failure Reroute"),
                h("option", { value: "capacity_overload" }, "3. Capacity Crisis (Partial Evac)"),
                h("option", { value: "isolated_failure" }, "4. Cut Off Hazard Zone (BFS Failure)")
              )
            )
          )
        )
      )
    )
  );
}

// Mount the React Application
window.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("root");
  if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(h(App));
  }
});
