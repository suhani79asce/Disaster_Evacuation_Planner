/**
 * Disaster Evacuation Planner - Interactive Leaflet Map Engine
 * Replaces demo schematic with a genuine Leaflet OpenStreetMap/CartoDB interactive map
 */

class EvacuationMap {
  constructor(containerId, onRoadClick = null) {
    this.containerId = containerId;
    this.onRoadClick = onRoadClick;
    this.activeRoute = ["A", "J_Banjara", "J_Central", "J_Secunderabad", "S02"];
    this.activeSourceNode = "A";
    this.activeTargetNode = "S02";
    this.bfsVisitedNodes = new Set();
    
    this.map = null;
    this.markersLayer = null;
    this.roadsLayer = null;
    this.routeLayer = null;

    this.initLeaflet();
  }

  initLeaflet() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Clear previous SVG or HTML content
    container.innerHTML = "";

    if (typeof L === 'undefined') {
      console.warn("Leaflet library not found, awaiting load...");
      setTimeout(() => this.initLeaflet(), 200);
      return;
    }

    // Initialize Leaflet Map centered on Hyderabad
    this.map = L.map(this.containerId, {
      center: [17.4050, 78.4700],
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });

    // Add CartoDB Positron clean light tiles (matching reference dashboard theme)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(this.map);

    // Layer Groups
    this.roadsLayer = L.layerGroup().addTo(this.map);
    this.routeLayer = L.layerGroup().addTo(this.map);
    this.markersLayer = L.layerGroup().addTo(this.map);

    // Wire up Toolbar Zoom & Locate Controls
    const btnIn = document.getElementById("btnZoomIn");
    const btnOut = document.getElementById("btnZoomOut");
    const btnLoc = document.getElementById("btnLocate");

    if (btnIn) btnIn.onclick = () => this.map.zoomIn();
    if (btnOut) btnOut.onclick = () => this.map.zoomOut();
    if (btnLoc) btnLoc.onclick = () => this.map.setView([17.4050, 78.4700], 12);

    // Add Clean Floating Map Legend
    this.addMapLegend();

    // Initial render of nodes and roads
    this.render();
  }

  addMapLegend() {
    if (!this.map) return;

    const legendControl = L.control({ position: 'bottomleft' });
    legendControl.onAdd = () => {
      const div = L.DomUtil.create('div', 'leaflet-legend-box');
      div.innerHTML = `
        <div class="legend-header">MAP LEGEND</div>
        <div class="legend-grid">
          <div class="legend-item"><span class="leg-sym dot-red"></span> Emergency Zone</div>
          <div class="legend-item"><span class="leg-sym dot-green"></span> Safe Shelter</div>
          <div class="legend-item"><span class="leg-sym dot-blue"></span> Transit Hub</div>
          <div class="legend-item"><span class="leg-sym line-dashed-red"></span> Blocked Road</div>
          <div class="legend-item span-full"><span class="leg-sym line-solid-blue"></span> Active Evacuation Route</div>
        </div>
      `;
      return div;
    };
    legendControl.addTo(this.map);
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
    if (!this.map || !this.roadsLayer || !this.markersLayer) return;

    const scenario = state || DEFAULT_SCENARIO;
    const positions = scenario.nodePositions || NODE_POSITIONS;
    const roads = scenario.roads || [];

    // Clear existing dynamic layers
    this.roadsLayer.clearLayers();
    this.routeLayer.clearLayers();
    this.markersLayer.clearLayers();

    // 1. RENDER ROADS
    roads.forEach(road => {
      const p1 = positions[road.source];
      const p2 = positions[road.destination];
      if (!p1 || !p2 || !p1.lat || !p2.lat) return;

      const latlngs = [[p1.lat, p1.lng], [p2.lat, p2.lng]];
      const isBlocked = road.blocked;
      const isActive = this.isEdgeInActiveRoute(road.source, road.destination);

      if (isBlocked) {
        // Blocked Road: Red Dashed Line
        const poly = L.polyline(latlngs, {
          color: '#ef4444',
          weight: 5,
          dashArray: '8, 8',
          opacity: 0.9,
          className: 'leaflet-road-blocked'
        });

        poly.bindTooltip(`⛔ <strong>BLOCKED:</strong> ${road.source} ↔ ${road.destination} (${road.cost} km)<br><em>Click to Unblock</em>`, {
          sticky: true,
          className: 'map-tooltip'
        });

        poly.on('click', () => {
          if (this.onRoadClick) this.onRoadClick(road.id);
        });

        this.roadsLayer.addLayer(poly);

      } else if (isActive) {
        // Active Evacuation Route: Glowing Blue Line
        const glow = L.polyline(latlngs, {
          color: '#0284c7',
          weight: 8,
          opacity: 0.85,
          className: 'leaflet-route-glow'
        });

        const core = L.polyline(latlngs, {
          color: '#38bdf8',
          weight: 4,
          opacity: 1
        });

        glow.bindTooltip(`✔ <strong>Active Route:</strong> ${road.source} ↔ ${road.destination} (${road.cost} km)`, {
          sticky: true,
          className: 'map-tooltip'
        });

        glow.on('click', () => {
          if (this.onRoadClick) this.onRoadClick(road.id);
        });

        this.routeLayer.addLayer(glow);
        this.routeLayer.addLayer(core);

      } else {
        // Normal Open Road
        const poly = L.polyline(latlngs, {
          color: '#64748b',
          weight: 4,
          opacity: 0.65,
          className: 'leaflet-road-normal'
        });

        poly.bindTooltip(`Road: ${road.source} ↔ ${road.destination} (${road.cost} km)<br><em>Click to Block</em>`, {
          sticky: true,
          className: 'map-tooltip'
        });

        poly.on('click', () => {
          if (this.onRoadClick) this.onRoadClick(road.id);
        });

        this.roadsLayer.addLayer(poly);
      }
    });

    // 2. RENDER MARKERS (Nodes)
    Object.keys(positions).forEach(id => {
      const pos = positions[id];
      if (!pos || !pos.lat || !pos.lng) return;

      const type = pos.type; // 'danger', 'shelter', 'transit'
      const isSource = this.activeSourceNode === id;
      const isTarget = this.activeTargetNode === id;

      let iconHtml = "";

      if (type === "danger") {
        iconHtml = `
          <div class="leaflet-pin-wrapper pin-danger ${isSource ? 'active-pulse' : ''}">
            <div class="pin-badge pin-bg-red">🔥</div>
            <div class="pin-label-pill pill-red">${pos.label}</div>
          </div>
        `;
      } else if (type === "shelter") {
        iconHtml = `
          <div class="leaflet-pin-wrapper pin-shelter ${isTarget ? 'active-pulse' : ''}">
            <div class="pin-badge pin-bg-green">🏠</div>
            <div class="pin-label-pill pill-green">${id}</div>
          </div>
        `;
      } else {
        iconHtml = `
          <div class="leaflet-pin-wrapper pin-transit">
            <div class="transit-dot-hub"></div>
            <div class="pin-label-pill pill-blue">${pos.label}</div>
          </div>
        `;
      }

      const customIcon = L.divIcon({
        className: 'leaflet-custom-div-icon',
        html: iconHtml,
        iconSize: [60, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([pos.lat, pos.lng], { icon: customIcon });
      marker.bindPopup(`<strong>${pos.name || pos.label}</strong><br>Type: ${type.toUpperCase()}`);
      this.markersLayer.addLayer(marker);
    });
  }
}
