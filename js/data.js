/**
 * Disaster Evacuation Planner - Data Models matching Reference UI
 * Location: Hyderabad Emergency Operations Network
 */

const PRESETS = {
  standard: {
    name: "Hyderabad Metro Scenario",
    description: "Multi-zone disaster triage with Fire, Flood, Accident, and Landslide emergencies.",
    zones: [
      {
        id: "A",
        name: "Zone A",
        type: "Fire",
        icon: "🔥",
        severityLabel: "CRITICAL",
        severityClass: "badge-critical",
        population: 320,
        threatSeverity: 95,
        timeUrgency: 90,
        vulnerability: 85,
        priorityScore: 10,
        evacuated: 0,
        remaining: 320,
        status: "WAITING"
      },
      {
        id: "C",
        name: "Zone C",
        type: "Flood",
        icon: "🌊",
        severityLabel: "HIGH",
        severityClass: "badge-orange",
        population: 180,
        threatSeverity: 80,
        timeUrgency: 75,
        vulnerability: 70,
        priorityScore: 8,
        evacuated: 0,
        remaining: 180,
        status: "WAITING"
      },
      {
        id: "D",
        name: "Zone D",
        type: "Accident",
        icon: "🚗",
        severityLabel: "HIGH",
        severityClass: "badge-orange",
        population: 120,
        threatSeverity: 75,
        timeUrgency: 70,
        vulnerability: 65,
        priorityScore: 7,
        evacuated: 0,
        remaining: 120,
        status: "WAITING"
      },
      {
        id: "B",
        name: "Zone B",
        type: "Fire",
        icon: "🔥",
        severityLabel: "MEDIUM",
        severityClass: "badge-yellow",
        population: 90,
        threatSeverity: 60,
        timeUrgency: 55,
        vulnerability: 50,
        priorityScore: 5,
        evacuated: 0,
        remaining: 90,
        status: "WAITING"
      },
      {
        id: "E",
        name: "Zone E",
        type: "Landslide",
        icon: "⛰",
        severityLabel: "LOW",
        severityClass: "badge-green",
        population: 60,
        threatSeverity: 45,
        timeUrgency: 40,
        vulnerability: 35,
        priorityScore: 3,
        evacuated: 0,
        remaining: 60,
        status: "WAITING"
      }
    ],

    transitNodes: [
      { id: "J_Banjara", name: "Banjara Hills" },
      { id: "J_Central", name: "Hyderabad Central" },
      { id: "J_Charminar", name: "Charminar Junction" },
      { id: "J_Secunderabad", name: "Secunderabad Junction" }
    ],

    shelters: [
      {
        id: "S01",
        name: "Shelter S01",
        location: "Mehdipatnam Complex",
        totalCapacity: 500,
        currentOccupancy: 320
      },
      {
        id: "S02",
        name: "Shelter S02",
        location: "Secunderabad Stadium",
        totalCapacity: 1000,
        currentOccupancy: 450
      },
      {
        id: "S03",
        name: "Shelter S03",
        location: "East Regional Center",
        totalCapacity: 800,
        currentOccupancy: 720
      },
      {
        id: "S04",
        name: "Shelter S04",
        location: "South Sports Arena",
        totalCapacity: 600,
        currentOccupancy: 150
      }
    ],

    roads: [
      { id: "A-J_Banjara", source: "A", destination: "J_Banjara", cost: 3.2, blocked: false },
      { id: "C-J_Banjara", source: "C", destination: "J_Banjara", cost: 2.8, blocked: false },
      { id: "J_Banjara-J_Central", source: "J_Banjara", destination: "J_Central", cost: 3.5, blocked: false },
      { id: "C-J_Central", source: "C", destination: "J_Central", cost: 4.1, blocked: true }, // Blocked road matching screenshot
      { id: "J_Central-S01", source: "J_Central", destination: "S01", cost: 2.5, blocked: false },
      { id: "J_Central-J_Charminar", source: "J_Central", destination: "J_Charminar", cost: 3.0, blocked: false },
      { id: "J_Central-S02", source: "J_Central", destination: "S02", cost: 4.9, blocked: false },
      { id: "J_Central-J_Secunderabad", source: "J_Central", destination: "J_Secunderabad", cost: 3.8, blocked: false },
      { id: "J_Secunderabad-S02", source: "J_Secunderabad", destination: "S02", cost: 2.1, blocked: false },
      { id: "J_Central-S03", source: "J_Central", destination: "S03", cost: 5.2, blocked: true }, // Blocked road towards east
      { id: "J_Charminar-S03", source: "J_Charminar", destination: "S03", cost: 6.0, blocked: false },
      { id: "J_Charminar-S04", source: "J_Charminar", destination: "S04", cost: 3.4, blocked: false },
      { id: "B-J_Charminar", source: "B", destination: "J_Charminar", cost: 3.0, blocked: false },
      { id: "D-J_Banjara", source: "D", destination: "J_Banjara", cost: 2.2, blocked: false },
      { id: "E-J_Charminar", source: "E", destination: "J_Charminar", cost: 4.5, blocked: false }
    ]
  }
};

// Real-world Hyderabad GPS coordinates for Leaflet Map
const NODE_POSITIONS = {
  // Danger Zones
  A: { lat: 17.4550, lng: 78.4420, x: 320, y: 70, label: "Zone A", type: "danger", name: "Zone A (Fire)" },
  D: { lat: 17.4320, lng: 78.4080, x: 140, y: 120, label: "Zone D", type: "danger", name: "Zone D (Accident)" },
  C: { lat: 17.4260, lng: 78.4520, x: 120, y: 260, label: "Zone C", type: "danger", name: "Zone C (Flood)" },
  B: { lat: 17.3830, lng: 78.4020, x: 250, y: 440, label: "Zone B", type: "danger", name: "Zone B (Fire)" },
  E: { lat: 17.3320, lng: 78.4680, x: 370, y: 475, label: "Zone E", type: "danger", name: "Zone E (Landslide)" },

  // Transit Junctions
  J_Banjara: { lat: 17.4160, lng: 78.4350, x: 320, y: 220, label: "Banjara Hills", type: "transit", name: "Banjara Hills" },
  J_Central: { lat: 17.3910, lng: 78.4720, x: 490, y: 270, label: "Hyderabad", type: "transit", name: "Hyderabad Central" },
  J_Secunderabad: { lat: 17.4410, lng: 78.5020, x: 650, y: 150, label: "Secunderabad", type: "transit", name: "Secunderabad" },
  J_Charminar: { lat: 17.3616, lng: 78.4747, x: 490, y: 420, label: "Charminar", type: "transit", name: "Charminar" },

  // Safe Shelters
  S01: { lat: 17.3930, lng: 78.4410, x: 180, y: 380, label: "S01", type: "shelter", name: "Shelter S01 (Mehdipatnam)" },
  S02: { lat: 17.4520, lng: 78.5080, x: 820, y: 120, label: "S02", type: "shelter", name: "Shelter S02 (Gymkhana)" },
  S03: { lat: 17.4020, lng: 78.5520, x: 800, y: 330, label: "S03", type: "shelter", name: "Shelter S03 (Uppal)" },
  S04: { lat: 17.3380, lng: 78.4890, x: 680, y: 440, label: "S04", type: "shelter", name: "Shelter S04 (Sports Arena)" }
};

const DEFAULT_SCENARIO = {
  ...PRESETS.standard,
  nodePositions: NODE_POSITIONS
};

function cloneScenario(scenario = DEFAULT_SCENARIO) {
  const cloned = JSON.parse(JSON.stringify(scenario));
  if (!cloned.nodePositions) {
    cloned.nodePositions = NODE_POSITIONS;
  }
  return cloned;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PRESETS, NODE_POSITIONS, DEFAULT_SCENARIO, cloneScenario };
}
if (typeof globalThis !== 'undefined') {
  globalThis.PRESETS = PRESETS;
  globalThis.NODE_POSITIONS = NODE_POSITIONS;
  globalThis.DEFAULT_SCENARIO = DEFAULT_SCENARIO;
  globalThis.cloneScenario = cloneScenario;
}
