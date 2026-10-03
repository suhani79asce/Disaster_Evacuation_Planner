/**
 * Disaster Evacuation Planner - Realistic Schematic City Map Renderer
 * Styled exactly like the Reference Emergency Control Center UI
 */

class EvacuationMap {
  constructor(containerId, onRoadClick = null) {
    this.container = document.getElementById(containerId);
    this.onRoadClick = onRoadClick;
    this.activeRoute = ["A", "J_Banjara", "J_Central", "J_Secunderabad", "S02"]; // Default active demo route matching screenshot
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
      <svg viewBox="0 0 820 480" class="city-map-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="map-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.15" />
          </filter>
          <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#0284c7" flood-opacity="0.5" />
          </filter>
        </defs>

        <!-- 1. MAP BASE TERRAIN -->
        <rect width="100%" height="100%" fill="#f4f8fa" />

        <!-- Green Park Areas -->
        <path d="M 40 40 Q 120 20 180 80 T 150 200 Q 80 180 40 120 Z" fill="#e5f5e0" opacity="0.7" />
        <path d="M 680 80 Q 760 120 740 220 T 640 180 Z" fill="#e5f5e0" opacity="0.6" />
        <path d="M 220 380 Q 300 360 340 440 T 260 480 Z" fill="#e5f5e0" opacity="0.7" />

        <!-- Hussain Sagar Lake (Matching screenshot) -->
        <path d="M 520 240 C 560 210, 620 220, 670 235 C 720 250, 740 280, 720 320 C 690 350, 630 360, 580 340 C 540 325, 500 270, 520 240 Z" 
              fill="#bfe1fc" stroke="#90cdf4" stroke-width="1.5" />
        <text x="625" y="290" text-anchor="middle" font-size="11" font-weight="600" fill="#2b6cb0" font-family="'Plus Jakarta Sans', sans-serif">
          Hussain Sagar Lake
        </text>

        <!-- City Grid Roads (Background street network) -->
        <g stroke="#e2e8f0" stroke-width="1.5">
          <line x1="0" y1="120" x2="820" y2="120" />
          <line x1="0" y1="220" x2="820" y2="220" />
          <line x1="0" y1="340" x2="820" y2="340" />
          <line x1="0" y1="440" x2="820" y2="440" />
          <line x1="160" y1="0" x2="160" y2="480" />
          <line x1="300" y1="0" x2="300" y2="480" />
          <line x1="480" y1="0" x2="480" y2="480" />
          <line x1="650" y1="0" x2="650" y2="480" />
        </g>

        <!-- Major Arterial Highways -->
        <path d="M 50 160 Q 250 170 450 260 T 780 200" fill="none" stroke="#fed7aa" stroke-width="4.5" />
        <path d="M 380 40 L 450 260 L 430 460" fill="none" stroke="#fed7aa" stroke-width="4.5" />

        <!-- Highway Badges -->
        <g transform="translate(520, 140)">
          <rect x="-14" y="-7" width="28" height="14" rx="3" fill="#fef08a" stroke="#d97706" stroke-width="1" />
          <text text-anchor="middle" y="3.5" font-size="8" font-weight="700" fill="#92400e">NH 65</text>
        </g>
        <g transform="translate(355, 340)">
          <rect x="-14" y="-7" width="28" height="14" rx="3" fill="#fef08a" stroke="#d97706" stroke-width="1" />
          <text text-anchor="middle" y="3.5" font-size="8" font-weight="700" fill="#92400e">NH 44</text>
        </g>

        <!-- 2. ROUTE & ROAD NETWORK -->
        <g class="roads-layer">
    `;

    // Render each road
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
                stroke="transparent" stroke-width="26" />

          <!-- Road Underlay -->
          <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" 
                stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" />

          <!-- Normal / Blocked / Active Stroke -->
          ${isBlocked ? `
            <!-- Blocked Road: Red Dashed Line with Warning Marker -->
            <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" 
                  stroke="#ef4444" stroke-width="4.5" stroke-dasharray="6, 6" stroke-linecap="round" />
            <circle cx="${midX}" cy="${midY}" r="11" fill="#fee2e2" stroke="#ef4444" stroke-width="2" />
            <text x="${midX}" y="${midY + 4}" text-anchor="middle" font-size="11" font-weight="800" fill="#ef4444">✕</text>
          ` : (isActive ? `
            <!-- Active Evacuation Route: Solid Cyan / Blue with Pulse -->
            <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" 
                  stroke="#0284c7" stroke-width="6" stroke-linecap="round" filter="url(#route-glow)" />
            <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" 
                  stroke="#38bdf8" stroke-width="3" stroke-linecap="round" />
            <!-- Intermediate Waypoint Dots -->
            <circle cx="${midX}" cy="${midY}" r="4" fill="#ffffff" stroke="#0284c7" stroke-width="2" />
          ` : `
            <!-- Open Road -->
            <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" 
                  stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
          `)}
        </g>
      `;
    });

    svgHtml += `</g><!-- /roads-layer -->`;

    // 3. NODES & LANDMARKS LAYER
    svgHtml += `<g class="nodes-layer">`;

    // City landmarks labels (like in reference image)
    svgHtml += `
      <text x="375" y="218" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">Banjara Hills</text>
      <text x="450" y="285" text-anchor="middle" font-size="14" font-weight="800" fill="#1e293b">Hyderabad</text>
      <text x="430" y="405" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">Charminar</text>
      <text x="560" y="150" text-anchor="middle" font-size="12" font-weight="800" fill="#1e293b">Secunderabad</text>
    `;

    // Transit Points (Blue circular bus/car icons or dots)
    const transitPoints = ["J_Banjara", "J_Central", "J_Charminar", "J_Secunderabad"];
    transitPoints.forEach(id => {
      const pos = positions[id];
      if (!pos) return;
      svgHtml += `
        <g transform="translate(${pos.x}, ${pos.y})">
          <circle r="9" fill="#0284c7" stroke="#ffffff" stroke-width="2.5" filter="url(#map-shadow)" />
          <circle r="3.5" fill="#ffffff" />
        </g>
      `;
    });

    // Danger Zones (Red circular badge with flame/alert icon)
    const dangerZoneIds = ["A", "C", "D", "B", "E"];
    dangerZoneIds.forEach(id => {
      const pos = positions[id];
      if (!pos) return;
      const isA = id === "A";
      const isC = id === "C";

      // Render red pin badge matching reference screenshot
      svgHtml += `
        <g transform="translate(${pos.x}, ${pos.y})" class="map-pin-danger" style="cursor: pointer;">
          ${isA ? `
            <circle r="22" fill="#ef4444" fill-opacity="0.2" class="map-pulse-anim" />
          ` : ''}
          <circle r="15" fill="#ef4444" stroke="#ffffff" stroke-width="2.5" filter="url(#map-shadow)" />
          <text y="4" text-anchor="middle" font-size="10" fill="#ffffff">🔥</text>
          
          <!-- Label Pill -->
          <g transform="translate(20, -5)">
            <rect x="0" y="-8" width="54" height="18" rx="4" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" filter="url(#map-shadow)" />
            <text x="6" y="5" font-size="9" font-weight="700" fill="#dc2626">${pos.label}</text>
          </g>
        </g>
      `;
    });

    // Safe Shelters (Green circular badge with house icon)
    const shelterIds = ["S01", "S02", "S03", "S04"];
    shelterIds.forEach(id => {
      const pos = positions[id];
      if (!pos) return;
      const isTarget = this.activeTargetNode === id;

      svgHtml += `
        <g transform="translate(${pos.x}, ${pos.y})" class="map-pin-shelter" style="cursor: pointer;">
          ${isTarget ? `
            <circle r="22" fill="#10b981" fill-opacity="0.25" class="map-pulse-anim" />
          ` : ''}
          <circle r="16" fill="#10b981" stroke="#ffffff" stroke-width="2.5" filter="url(#map-shadow)" />
          <text y="4" text-anchor="middle" font-size="10" fill="#ffffff">🏠</text>

          <!-- Label below -->
          <g transform="translate(0, 24)">
            <rect x="-18" y="-7" width="36" height="15" rx="3" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" filter="url(#map-shadow)" />
            <text x="0" y="4" text-anchor="middle" font-size="8.5" font-weight="800" fill="#047857">${id}</text>
          </g>
        </g>
      `;
    });

    // Warning / Road Hazard Triangles on blocked segments
    svgHtml += `
      <g transform="translate(370, 245)">
        <polygon points="0,-10 10,8 -10,8" fill="#f59e0b" stroke="#ffffff" stroke-width="1.5" />
        <text y="6" text-anchor="middle" font-size="9" font-weight="900" fill="#000">!</text>
      </g>
      <g transform="translate(425, 220)">
        <polygon points="0,-10 10,8 -10,8" fill="#f59e0b" stroke="#ffffff" stroke-width="1.5" />
        <text y="6" text-anchor="middle" font-size="9" font-weight="900" fill="#000">!</text>
      </g>
      <g transform="translate(465, 140)">
        <polygon points="0,-10 10,8 -10,8" fill="#f59e0b" stroke="#ffffff" stroke-width="1.5" />
        <text y="6" text-anchor="middle" font-size="9" font-weight="900" fill="#000">!</text>
      </g>
    `;

    // Map Legend Overlay Box (Bottom Left - matching screenshot)
    svgHtml += `
      <g transform="translate(18, 380)" class="map-legend-card">
        <rect width="145" height="88" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" filter="url(#map-shadow)" />
        
        <circle cx="16" cy="18" r="4.5" fill="#ef4444" />
        <text x="28" y="21" font-size="9.5" font-weight="600" fill="#334155">Emergency</text>

        <circle cx="85" cy="18" r="4.5" fill="#10b981" />
        <text x="96" y="21" font-size="9.5" font-weight="600" fill="#334155">Shelter</text>

        <circle cx="16" cy="42" r="4.5" fill="#0284c7" />
        <text x="28" y="45" font-size="9.5" font-weight="600" fill="#334155">Normal Location</text>

        <line x1="82" y1="42" x2="94" y2="42" stroke="#ef4444" stroke-width="2.5" stroke-dasharray="2,2" />
        <text x="98" y="45" font-size="9.5" font-weight="600" fill="#334155">Blocked Road</text>

        <line x1="12" y1="68" x2="24" y2="68" stroke="#0284c7" stroke-width="3" />
        <text x="28" y="71" font-size="9.5" font-weight="600" fill="#334155">Evacuation Route</text>
      </g>
    `;

    // Coordinates and Scale Bar (Bottom Right - matching screenshot)
    svgHtml += `
      <g transform="translate(640, 410)">
        <rect x="0" y="0" width="165" height="56" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" filter="url(#map-shadow)" />
        
        <text x="82" y="20" text-anchor="middle" font-size="9" font-weight="700" fill="#475569">
          📍 17.3850° N, 78.4867° E
        </text>

        <line x1="20" y1="36" x2="145" y2="36" stroke="#94a3b8" stroke-width="1.5" />
        <line x1="20" y1="32" x2="20" y2="40" stroke="#94a3b8" stroke-width="1.5" />
        <line x1="62" y1="32" x2="62" y2="40" stroke="#94a3b8" stroke-width="1.5" />
        <line x1="104" y1="32" x2="104" y2="40" stroke="#94a3b8" stroke-width="1.5" />
        <line x1="145" y1="32" x2="145" y2="40" stroke="#94a3b8" stroke-width="1.5" />
        
        <text x="20" y="49" text-anchor="middle" font-size="7.5" fill="#64748b">0</text>
        <text x="62" y="49" text-anchor="middle" font-size="7.5" fill="#64748b">2</text>
        <text x="104" y="49" text-anchor="middle" font-size="7.5" fill="#64748b">4</text>
        <text x="145" y="49" text-anchor="middle" font-size="7.5" fill="#64748b">6 km</text>
      </g>
    `;

    // Compass Rose (Top Right)
    svgHtml += `
      <g transform="translate(775, 40)">
        <circle r="14" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" filter="url(#map-shadow)" />
        <polygon points="0,-10 3,0 -3,0" fill="#ef4444" />
        <polygon points="0,10 3,0 -3,0" fill="#94a3b8" />
        <text y="-3" x="0" text-anchor="middle" font-size="7" font-weight="900" fill="#1e293b">N</text>
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
