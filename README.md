# Disaster Evacuation Planner (DAA Hackathon Project)

> **Algorithm-Centric Emergency Operations Decision Engine combining Priority Queue, BFS, and Dijkstra's Algorithm with Live Shelter Capacity Validation, Blocked Road Handling, and Plain-English Decision Rationale.**

---

## 📌 1. Project Overview

**Disaster Evacuation Planner** is an advanced emergency operations decision-support system built for the **Design and Analysis of Algorithms (DAA)** challenge. It combines three core algorithmic techniques into a unified, deterministic pipeline:

```text
                 DISASTER DATA
                       │
                       ▼
                PRIORITY SCORE
                       │
                       ▼
                PRIORITY QUEUE (Binary Max-Heap)
                       │
                       ▼
              HIGHEST PRIORITY ZONE
                       │
                       ▼
             BFS REACHABILITY & MIN-HOPS
                       │
              Reachable Shelters
                       │
                       ▼
             SHELTER CAPACITY VALIDATION
                       │
               Feasible Shelters
                       │
                       ▼
             DIJKSTRA'S ALGORITHM (Binary Min-Heap)
                       │
              Minimum-Cost Route
                       │
                       ▼
             FINAL EVACUATION PLAN & EXPLANATION
```

---

## 🧮 2. Algorithmic Separation & Core Formulations

Each algorithm has an explicit, non-overlapping responsibility:

| Algorithm | Purpose | Theoretical Output | Live Execution Role |
| :--- | :--- | :--- | :--- |
| **Priority Queue** | Evacuation Prioritization | Highest-priority disaster zone | Determines *what zone to evacuate first* via a Binary Max-Heap. |
| **BFS** | Reachability & Minimum-Hop Analysis | Reachable shelters + hop counts | Traverses only open roads level-by-layer to determine *which shelters are reachable and how many hops away*. |
| **Dijkstra's Algorithm** | Minimum-Cost Routing | Best feasible route + total road cost | Finds the *minimum-cost feasible route* among shelters passing capacity constraints. |

---

### A. Priority Score & Deterministic Tie-Breaking
The priority score formula evaluates threat severity, relative population factor, time urgency, and structural vulnerability:

$$\text{Priority Score} = 0.40 \times \text{Threat Severity} + 0.25 \times \text{Population Factor} + 0.20 \times \text{Time Urgency} + 0.15 \times \text{Vulnerability}$$

* All factors are normalized to the range $[0, 100]$.
* **Population Factor** is strictly relative rather than raw:
  $$\text{Population Factor} = \left(\frac{\text{Zone Population}}{\text{Maximum Affected Population}}\right) \times 100$$
* **Deterministic Tie-Breaking:** When two zones produce identical priority scores, the heap resolves ties using:
  1. Higher **Threat Severity**
  2. Higher **Time Urgency**
  3. Alphabetical **Zone ID**

---

### B. Breadth-First Search (BFS) — Reachability & Minimum Hops
Given a selected danger zone:
1. Starts BFS from the active disaster zone.
2. Traverses **only open roads** (`status === 'open'` and `!blocked`).
3. Ignores blocked roads (`if (edge.blocked || edge.status === 'blocked') continue`).
4. Generates a level-by-level traversal:
   - **Level 0:** Root Zone
   - **Level 1:** Immediate neighbors
   - **Level 2:** Second-degree transit nodes & shelters
   - **Level 3+:** Distant shelters
5. Identifies **reachable shelters**, calculates the exact hop count for each, and reports the **minimum-hop reachable shelter**.

---

### C. Shelter Capacity Validation & Infeasibility Rejection
Before a shelter can be chosen as an evacuation destination, capacity must be verified:

$$\text{Available Capacity} = \text{Total Capacity} - \text{Occupied Capacity}$$

* **Feasibility Check:**
  $$\text{Available Capacity} \ge \text{Required Evacuation Population}$$
* If available capacity is insufficient, the shelter is marked **`INFEASIBLE / REJECTED`** with an explicit reason displayed in the UI:
  $$\text{"Insufficient capacity: Required } X > \text{Available } Y\text{"}$$
* Rejected shelters are never chosen as the final destination if a feasible alternative exists.

---

### D. Dijkstra's Algorithm — Minimum-Cost Route
* Finds the minimum distance/cost path from the active danger zone to capacity-feasible shelters.
* Maintained using a genuine **Binary Min-Heap** with edge relaxation:
  $$\text{dist}[u] + \text{weight}(u, v) < \text{dist}[v] \implies \text{dist}[v] = \text{dist}[u] + \text{weight}(u, v),\quad \text{prev}[v] = u$$
* Ignores blocked edges.
* Reconstructs the final optimal evacuation path by walking predecessor pointers backwards from target to source.

---

## 💡 3. "Why This Decision?" Algorithmic Explainer

The dashboard features a dedicated plain-English explanation panel explaining every choice made by the system:
1. **Why Zone Was Prioritized:**
   - Displays exact factor breakdown (Threat: 95/100, Pop Factor: 100/100, Urgency: 90/100, Vulnerability: 85/100).
   - Shows computed priority score (e.g., 93.8/100) and confirms extraction from the root of the Binary Max-Heap.
2. **Why Shelter Was Selected:**
   - Audits every shelter against BFS reachability and available capacity.
   - Clarifies why infeasible shelters were rejected.
   - Shows why the chosen shelter minimized the total Dijkstra travel cost.

---

## 🗺 4. Interactive Leaflet Map

The application uses an interactive Leaflet map with CartoDB Positron tiles centered on the Hyderabad Metro emergency network:
* **Disaster Zones:** Red glowing pins showing icon, label, priority score, and popup with full factor breakdown.
* **Shelters:** Green pins displaying capacity status and availability.
* **Transit Junctions:** Transit hubs linking major arterial corridors.
* **Open Roads:** Slate solid lines displaying distance/cost.
* **Blocked Roads:** Red dashed hazard lines with tooltip indicating road closure. Clicking any road toggles its blocked state.
* **Active Evacuation Route:** Highlighted glowing blue polyline.

---

## 🌐 5. Backend REST API

The Node.js server (`server.js`) exposes genuine REST endpoints for all algorithmic operations:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/calculate-priority` | Computes normalized Priority Score and factor breakdown for one or all zones. |
| `POST` | `/priority-queue` | Inserts zones into Binary Max-Heap and returns deterministic extraction order. |
| `POST` | `/bfs` | Executes BFS level-order traversal, returns reachable shelters and minimum-hop shelter. |
| `POST` | `/dijkstra` | Computes minimum-cost path between start node and target shelter with tentative costs. |
| `POST` | `/evacuation-plan` | Runs complete end-to-end pipeline and returns selected zone, BFS reachability, capacity audits, Dijkstra route, and plain-English explanation. |

### Sample Response (`POST /evacuation-plan`):
```json
{
  "success": true,
  "selected_zone": "A",
  "priority_score": 93.8,
  "priority_breakdown": {
    "threat": 95,
    "population_factor": 100,
    "urgency": 90,
    "vulnerability": 85
  },
  "bfs": {
    "reachable_shelters": [
      { "id": "S01", "hops": 3 },
      { "id": "S02", "hops": 3 },
      { "id": "S04", "hops": 4 }
    ],
    "minimum_hop_shelter": "S01",
    "minimum_hops": 3,
    "levels": {
      "0": ["A"],
      "1": ["J_Banjara", "J_Hitec"],
      "2": ["J_Central", "J_Secunderabad"],
      "3": ["S01", "S02"],
      "4": ["S04"]
    }
  },
  "shelters": {
    "S01": { "feasible": false, "reason": "Insufficient capacity: Required 320 > Available 150" },
    "S02": { "feasible": true, "available_capacity": 450 }
  },
  "dijkstra": {
    "target_shelter": "S02",
    "route": ["A", "J_Banjara", "J_Central", "S02"],
    "total_cost": 11.6,
    "visited_order": ["A", "J_Banjara", "J_Central", "S02"]
  },
  "explanation": {
    "why_zone_prioritized": "Zone A was prioritized with a Priority Score of 93.8/100...",
    "why_shelter_selected": "Shelter S02 was selected because it is verified reachable via BFS (3 hops), has sufficient capacity (450 available >= 320 required), and minimizes Dijkstra travel cost (11.6 km)."
  }
}
```

---

## 🛠 6. Technology Stack Architecture

This project is built using:
1. **Python**: Pure Python implementation of DAA algorithms (`PriorityQueue` with `heapq`, `BFS` with `collections.deque`, `Dijkstra` with `heapq`, capacity validation, deterministic tie-breaking).
2. **Flask**: REST API server (`backend/app.py`) providing `/calculate-priority`, `/priority-queue`, `/bfs`, `/dijkstra`, `/evacuation-plan`, and static web serving.
3. **React**: Reactive component architecture (`js/react-app.js`) with React 18 hooks (`useState`, `useEffect`, `useCallback`, `useRef`).
4. **Leaflet**: Real-time CartoDB Positron interactive map with custom pins, road polylines, blocked road toggles, glowing routes, and BFS halos.

---

## 🚀 7. How to Run Locally

### Option A: Python + Flask Server (Recommended)
1. Install dependencies (if using external Python):
   ```bash
   pip install -r backend/requirements.txt
   ```
2. Start the Flask application:
   ```bash
   python run_backend.py
   ```
   *(Or double-click `run_backend.bat` on Windows)*
3. Open your browser at:
   ```
   http://127.0.0.1:5000/
   ```

### Option B: Node.js Server
```bash
node server.js
```
Open your browser at:
```
http://localhost:8080/
```

### Running Automated Algorithmic Test Suites

#### 1. Python Unit Test Suite:
```bash
python backend/test_algorithms.py
```
*(Runs 20 automated tests validating Priority Queue, BFS, Dijkstra, and Capacity Validation)*

#### 2. JavaScript / Node.js Test Suite:
```bash
node test_algorithms.js
node test_full_simulation.js
```

---

## 🏆 7. Final Acceptance Criteria Verification

- [x] **Priority Queue**: Implemented with Binary Max-Heap and deterministic tie-breaking.
- [x] **Priority Score Formula**: $0.40 \cdot \text{Threat} + 0.25 \cdot \text{PopFactor} + 0.20 \cdot \text{Urgency} + 0.15 \cdot \text{Vulnerability}$.
- [x] **Relative Population Factor**: Normalized relative to largest affected zone.
- [x] **BFS**: Level-order traversal computing reachability, hop counts, and minimum-hop shelter.
- [x] **Dijkstra**: Binary Min-Heap with tentative costs table, relaxation tracking, and predecessor path reconstruction.
- [x] **Blocked Roads**: Represented in graph, strictly excluded by both BFS and Dijkstra.
- [x] **Shelter Capacity Validation**: Checked against required population; insufficient capacity shelters rejected.
- [x] **Algorithm Execution Visibility**: Live step-by-step inspector, tentative cost table, and BFS level breakdown.
- [x] **Interactive Leaflet Map**: Displays roads, shelters, zones, and route overlays.
- [x] **Algorithm Comparison**: Table showing purposes, outputs, and live calculated values.
- [x] **Plain-English Explainer**: Dedicated "Why This Decision?" panel.
- [x] **Backend REST API**: Complete POST endpoints for DAA operations.
- [x] **Preserved Functionality**: All existing scenarios, simulation controls, and data models preserved.