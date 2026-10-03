/**
 * Disaster Evacuation Planner - Clean, High-Clarity City Map Renderer
 * Spacious layout eliminating overlap and congestion
 */

class EvacuationMap {
  constructor(containerId, onRoadClick = null) {
    this.container = document.getElementById(containerId);
    this.onRoadClick = onRoadClick;
    this.activeRoute = ["A", "J_Banjara", "J_Central", "J_Secunderabad", "S02"];
    this.activeSourceNode = "A";
    this.activeTargetNode = "S02";
    this.bfsVisitedNodes = new Set();
    this.render();
  }

  setRoadClickHandler(handler) {
    this.onRoadClick = handler;
  }

  setActiveRoute(path = [], source = null, target = null) {
    this.activeRoute = path || [];
    this.activeSourceNode = source || (path.length > 0 ? path[0] : null);
    this.activeTargetNode = target || (path.length > 0 ? path[path.length - 1] : null);
  }

  setBfsVisited(nodes = []) {
    this.bfsVisitedNodes = new Set(nodes);
  }

  clearHighlights() {
    this.activeRoute = [];
    this.activeSourceNode = null;
    this.activeTargetNode = null;
    this.bfsVisitedNodes.clear();
  }

  isEdgeInActiveRoute(u, v) {
    if (!this.activeRoute || this.activeRoute.length < 2) return false;
    for (let i = 0; i < this.activeRoute.length - 1; i++) {
      const a = this.activeRoute[i];
      const b = this.activeRoute[i + 1];
      if ((a === u && b === v) || (a === v && b === u)) {
        return true;
      }
    }
    return false;
  }

  render(state = null) {
    if (!this.container) return;
    const scenario = state || DEFAULT_SCENARIO;
    const positions = scenario.nodePositions || NODE_POSITIONS;
    const roads = scenario.roads || [];

    let svgHtml = `
      <svg viewBox="0 0 940 520" class="city-map-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="map-shadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.12" />
          </filter>
          <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#0284c7" flood-opacity="0.6" />
          </filter>
        </defs>

        <!-- 1. MAP BASE TERRAIN -->
        <rect width="100%" height="100%" fill="#f8fafc" />

        <!-- Soft Green Parklands (Non-intrusive in corners) -->
        <path d="M 0 0 L 160 0 Q 140 100 0 140 Z" fill="#ecfdf5" />
        <path d="M 800 0 Q 860 60 940 80 L 940 0 Z" fill="#ecfdf5" />
        <path d="M 0 420 Q 80 440 120 520 L 0 520 Z" fill="#ecfdf5" />
        <path d="M 840 520 Q 860 440 940 430 L 940 520 Z" fill="#ecfdf5" />

        <!-- Grid Lines for Map Orientation -->
        <g stroke="#f1f5f9" stroke-width="1.5">
          <line x1="0" y1="130" x2="940" y2="130" />
          <line x1="0" y1="260" x2="940" y2="260" />
          <line x1="0" y1="390" x2="940" y2="390" />
          <line x1="235" y1="0" x2="235" y2="520" />
          <line x1="470" y1="0" x2="470" y2="520" />
          <line x1="705" y1="0" x2="705" y2="520" />
        </g>

        <!-- Hussain Sagar Lake (Positioned in open right-center bay) -->
        <path d="M 580 240 C 630 205, 690 210, 740 230 C 785 250, 795 285, 775 315 C 745 345, 685 355, 635 335 C 595 320, 560 270, 580 240 Z" 
              fill="#dbeafe" stroke="#bfdbfe" stroke-width="2" />
        <text x="675" y="285" text-anchor="middle" font-size="11" font-weight="700" fill="#2563eb" font-family="'Plus Jakarta Sans', sans-serif">
          Hussain Sagar Lake
        </text>

        <!-- Subtle Arterial Highway Corridors (Soft, low contrast behind network) -->
        <path d="M 60 180 Q 240 220 490 270 T 880 220" fill="none" stroke="#fed7aa" stroke-width="3" opacity="0.6" />
        <path d="M 320 20 L 490 270 L 490 510" fill="none" stroke="#fed7aa" stroke-width="3" opacity="0.6" />

        <!-- Highway Badges placed away from any node text -->
        <g transform="translate(530, 90)">
          <rect x="-14" y="-8" width="28" height="16" rx="4" fill="#fef08a" stroke="#d97706" stroke-width="1" />
          <text text-anchor="middle" y="4" font-size="8.5" font-weight="800" fill="#92400e">NH 65</text>
        </g>
        <g transform="translate(420, 360)">
          <rect x="-14" y="-8" width="28" height="16" rx="4" fill="#fef08a" stroke="#d97706" stroke-width="1" />
          <text text-anchor="middle" y="4" font-size="8.5" font-weight="800" fill="#92400e">NH 44</text>
        </g>

        <!-- 2. ROADS LAYER -->
        <g class="roads-layer">
    `;

    // Render road lines with ample spacing and clear distance tags
    roads.forEach(road => {
      const p1 = positions[road.source];
      const p2 = positions[road.destination];
      if (!p1 || !p2) return;

      const isBlocked = road.blocked;
      const isActive = this.isEdgeInActiveRoute(road.source, road.destination);

      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      svgHtml += `
        <g class="road-svg-group" data-road-id="${road.id}" style="cursor: pointer;">
          <!-- Thick Click Target -->
          <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" 
                stroke="transparent" stroke-width="32" />

          <!-- Road Bed Underlay -->
          <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" 
                stroke="#cbd5e1" stroke-width="6" stroke-linecap="round" />

          <!-- Road Core Line -->
          ${isBlocked ? `
            <!-- Blocked Road: Red Dashed Line with Hazard Pill -->
            <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" 
                  stroke="#ef4444" stroke-width="4.5" stroke-dasharray="8, 6" stroke-linecap="round" />
            
            <g transform="translate(${midX}, ${midY})">
              <rect x="-38" y="-12" width="76" height="24" rx="12" fill="#fee2e2" stroke="#ef4444" stroke-width="1.5" filter="url(#map-shadow)" />
              <text y="4" text-anchor="middle" font-size="9" font-weight="800" fill="#dc2626">✕ BLOCKED</text>
            </g>
          ` : (isActive ? `
            <!-- Active Evacuation Route: Vibrant Cyan-Blue with Animated Dash -->
            <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" 
                  stroke="#0284c7" stroke-width="7" stroke-linecap="round" filter="url(#route-glow)" />
            <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" 
                  stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round" />
            
            <!-- Distance Pill on Active Route -->
            <g transform="translate(${midX}, ${midY})">
              <rect x="-24" y="-10" width="48" height="20" rx="10" fill="#0284c7" stroke="#ffffff" stroke-width="1.5" filter="url(#map-shadow)" />
              <text y="4" text-anchor="middle" font-size="8.5" font-weight="800" fill="#ffffff">${road.cost} km</text>
            </g>
          ` : `
            <!-- Normal Open Road with Distance Pill -->
            <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" 
                  stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
            
            <g transform="translate(${midX}, ${midY})">
              <rect x="-22" y="-9" width="44" height="18" rx="9" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" filter="url(#map-shadow)" />
              <text y="3.5" text-anchor="middle" font-size="8" font-weight="700" fill="#475569">${road.cost} km</text>
            </g>
          `)}
        </g>
      `;
    });

    svgHtml += `</g><!-- /roads-layer -->`;

    // 3. NODES & TRANSIT HUBS LAYER
    svgHtml += `<g class="nodes-layer">`;

    // Transit Junctions (Banjara Hills, Hyderabad Central, Secunderabad, Charminar)
    const transitHubs = [
      { id: "J_Banjara", name: "Banjara Hills", labelY: 28 },
      { id: "J_Central", name: "Hyderabad Central", labelY: -26 },
      { id: "J_Secunderabad", name: "Secunderabad", labelY: -26 },
      { id: "J_Charminar", name: "Charminar", labelY: 28 }
    ];

    transitHubs.forEach(hub => {
      const pos = positions[hub.id];
      if (!pos) return;
      svgHtml += `
        <g transform="translate(${pos.x}, ${pos.y})" class="map-transit-hub">
          <circle r="12" fill="#0284c7" stroke="#ffffff" stroke-width="3" filter="url(#map-shadow)" />
          <circle r="4" fill="#ffffff" />

          <!-- White pill background for text readability -->
          <g transform="translate(0, ${hub.labelY})">
            <rect x="-56" y="-10" width="112" height="20" rx="10" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" filter="url(#map-shadow)" />
            <text y="4" text-anchor="middle" font-size="9.5" font-weight="800" fill="#0f172a">${hub.name}</text>
          </g>
        </g>
      `;
    });

    // Danger Zones (Red Badges with Flame Icons)
    const dangerZoneIds = ["A", "C", "D", "B", "E"];
    dangerZoneIds.forEach(id => {
      const pos = positions[id];
      if (!pos) return;
      const isTopActive = id === "A";

      svgHtml += `
        <g transform="translate(${pos.x}, ${pos.y})" class="map-pin-danger" style="cursor: pointer;">
          ${isTopActive ? `
            <circle r="26" fill="#ef4444" fill-opacity="0.2" class="map-pulse-anim" />
          ` : ''}
          <circle r="17" fill="#ef4444" stroke="#ffffff" stroke-width="3" filter="url(#map-shadow)" />
          <text y="5" text-anchor="middle" font-size="12">🔥</text>

          <!-- Label Pill -->
          <g transform="translate(22, -8)">
            <rect x="0" y="-8" width="58" height="20" rx="5" fill="#ffffff" stroke="#fca5a5" stroke-width="1.5" filter="url(#map-shadow)" />
            <text x="8" y="6" font-size="9.5" font-weight="800" fill="#dc2626">${pos.label}</text>
          </g>
        </g>
      `;
    });

    // Safe Shelters (Green Badges with House Icons)
    const shelterIds = ["S01", "S02", "S03", "S04"];
    shelterIds.forEach(id => {
      const pos = positions[id];
      if (!pos) return;
      const isTarget = this.activeTargetNode === id;

      svgHtml += `
        <g transform="translate(${pos.x}, ${pos.y})" class="map-pin-shelter" style="cursor: pointer;">
          ${isTarget ? `
            <circle r="26" fill="#10b981" fill-opacity="0.25" class="map-pulse-anim" />
          ` : ''}
          <circle r="18" fill="#10b981" stroke="#ffffff" stroke-width="3" filter="url(#map-shadow)" />
          <text y="5" text-anchor="middle" font-size="12">🏠</text>

          <!-- Label Pill below node -->
          <g transform="translate(0, 27)">
            <rect x="-24" y="-8" width="48" height="18" rx="9" fill="#ffffff" stroke="#86efac" stroke-width="1.5" filter="url(#map-shadow)" />
            <text x="0" y="4" text-anchor="middle" font-size="9" font-weight="800" fill="#047857">${id}</text>
          </g>
        </g>
      `;
    });

    // Map Legend Overlay Box (Bottom Left - Clean 2-column layout with ample width)
    svgHtml += `
      <g transform="translate(18, 395)" class="map-legend-card">
        <rect width="215" height="105" rx="10" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" filter="url(#map-shadow)" />
        
        <text x="14" y="20" font-size="9.5" font-weight="800" fill="#0f172a" text-transform="uppercase" letter-spacing="0.05em">MAP LEGEND</text>

        <!-- Column 1 -->
        <circle cx="22" cy="42" r="5" fill="#ef4444" />
        <text x="34" y="45.5" font-size="9.5" font-weight="600" fill="#334155">Emergency Zone</text>

        <circle cx="22" cy="68" r="5" fill="#0284c7" />
        <text x="34" y="71.5" font-size="9.5" font-weight="600" fill="#334155">Transit Junction</text>

        <line x1="16" y1="94" x2="30" y2="94" stroke="#0284c7" stroke-width="3.5" />
        <text x="34" y="97" font-size="9.5" font-weight="600" fill="#334155">Evacuation Route</text>

        <!-- Column 2 -->
        <circle cx="130" cy="42" r="5" fill="#10b981" />
        <text x="142" y="45.5" font-size="9.5" font-weight="600" fill="#334155">Safe Shelter</text>

        <line x1="124" y1="68" x2="138" y2="68" stroke="#ef4444" stroke-width="3" stroke-dasharray="3,3" />
        <text x="142" y="71.5" font-size="9.5" font-weight="600" fill="#dc2626">Blocked Road</text>
      </g>
    `;

    // Coordinates and Scale Bar (Bottom Right)
    svgHtml += `
      <g transform="translate(745, 445)">
        <rect x="0" y="0" width="175" height="58" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" filter="url(#map-shadow)" />
        
        <text x="88" y="20" text-anchor="middle" font-size="9" font-weight="700" fill="#475569">
          📍 17.3850° N, 78.4867° E
        </text>

        <line x1="20" y1="36" x2="155" y2="36" stroke="#94a3b8" stroke-width="1.5" />
        <line x1="20" y1="32" x2="20" y2="40" stroke="#94a3b8" stroke-width="1.5" />
        <line x1="65" y1="32" x2="65" y2="40" stroke="#94a3b8" stroke-width="1.5" />
        <line x1="110" y1="32" x2="110" y2="40" stroke="#94a3b8" stroke-width="1.5" />
        <line x1="155" y1="32" x2="155" y2="40" stroke="#94a3b8" stroke-width="1.5" />
        
        <text x="20" y="49" text-anchor="middle" font-size="7.5" fill="#64748b">0</text>
        <text x="65" y="49" text-anchor="middle" font-size="7.5" fill="#64748b">2</text>
        <text x="110" y="49" text-anchor="middle" font-size="7.5" fill="#64748b">4</text>
        <text x="155" y="49" text-anchor="middle" font-size="7.5" fill="#64748b">6 km</text>
      </g>
    `;

    // Compass Rose (Top Right)
    svgHtml += `
      <g transform="translate(895, 45)">
        <circle r="15" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" filter="url(#map-shadow)" />
        <polygon points="0,-11 4,0 -4,0" fill="#ef4444" />
        <polygon points="0,11 4,0 -4,0" fill="#94a3b8" />
        <text y="-3" x="0" text-anchor="middle" font-size="7.5" font-weight="900" fill="#1e293b">N</text>
      </g>
    `;

    svgHtml += `</g><!-- /nodes-layer --></svg>`;

    this.container.innerHTML = svgHtml;

    // Attach click events on roads
    const roadNodes = this.container.querySelectorAll(".road-svg-group");
    roadNodes.forEach(elem => {
      elem.addEventListener("click", () => {
        const roadId = elem.getAttribute("data-road-id");
        if (this.onRoadClick) this.onRoadClick(roadId);
      });
    });
  }
}
