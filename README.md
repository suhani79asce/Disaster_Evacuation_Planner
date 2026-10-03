# Disaster Evacuation Planner (DAA Hackathon Project)

> **Priority-Driven Emergency Routing Engine using Priority Queue, BFS, and Dijkstra's Algorithm with Dynamic Road Failure Rerouting**

---

## 📌 1. Project Overview

**Disaster Evacuation Planner** is an emergency operations decision-support system designed for the **Design and Analysis of Algorithms (DAA)** hackathon. It demonstrates how three foundational algorithmic techniques—**Binary Max-Heap Priority Queue**, **Breadth-First Search (BFS)**, and **Dijkstra's Shortest Path Algorithm with a Binary Min-Heap**—collaborate to solve the complex multi-constraint challenge of disaster evacuation.

The system addresses the core triage and routing workflow:
1. **Which disaster zone should receive attention first?** $\rightarrow$ **Priority Queue (Max-Heap)**
2. **Which shelters are physically reachable through non-blocked roadways?** $\rightarrow$ **Breadth-First Search (BFS)**
3. **Which reachable shelters have open spaces?** $\rightarrow$ **Capacity Constraint Filtering**
4. **What is the minimum travel cost/distance route to that shelter?** $\rightarrow$ **Dijkstra's Algorithm (Min-Heap)**
5. **How many people can be evacuated, and how to reroute when roads fail?** $\rightarrow$ **Iterative Allocation & Dynamic Recalculation**

---

## 📂 2. Project File Structure

```
Disaster_Evacuation_Planner/
├── index.html               # Main dashboard UI (accessible controls, SVG map, live terminal)
├── css/
│   └── style.css            # Dark emergency operations center theme (glassmorphism & cyber accents)
├── js/
│   ├── data.js              # Network topology, nodes, roads, capacities, and scenario presets
│   ├── algorithms.js        # Pure DAA algorithms: MaxHeap, BFS, MinHeap Dijkstra, Path Reconstruction
│   ├── map.js               # Interactive SVG schematic graph renderer with live route animation
│   └── app.js               # State controller, step-by-step orchestrator, execution logger, custom config
├── server.js                # Lightweight zero-dependency static HTTP server in Node.js
├── package.json             # NPM metadata and launch scripts
├── test_algorithms.js       # Automated test suite (27 unit tests verifying heap, BFS, Dijkstra, capacity)
├── test_full_simulation.js  # End-to-end simulation test verifying numbers and conservation
└── README.md                # Comprehensive documentation, proof, complexity, and judge walkthrough
```

---

## 🧮 3. Algorithmic Formulations

### A. Priority Queue (Binary Max-Heap) — Emergency Triage
Disaster zones cannot be processed arbitrarily or alphabetically. The system calculates a transparent multi-attribute **Risk Score**:

$$\text{Risk Score} = 0.40 \cdot \text{Threat Severity} + 0.25 \cdot \text{Population Factor} + 0.20 \cdot \text{Time Urgency} + 0.15 \cdot \text{Vulnerability}$$

* All inputs are normalized to the range $[0, 100]$.
* **Population Factor** is normalized against maximum expected density so large populations contribute to risk without overwhelming threat severity.
* Zones are inserted into a **Binary Max-Heap**.
* The zone with the highest Risk Score is extracted in $O(\log V)$ time.

**Priority Levels:**
* **CRITICAL**: $90 - 100$
* **HIGH**: $75 - 89$
* **MEDIUM**: $50 - 74$
* **LOW**: $0 - 49$

---

### B. Breadth-First Search (BFS) — Topological Reachability
* **Purpose:** BFS is intentionally **not** used for weighted shortest paths. Instead, BFS determines topological connectivity: *"Can this danger zone reach this shelter using currently available (non-blocked) roads?"*
* **Implementation:** Standard FIFO queue exploring layer-by-layer over an adjacency list representation. Blocked roads are strictly omitted from edges.
* Shelters unreachable under current road conditions are immediately pruned before running Dijkstra.

---

### C. Dijkstra's Algorithm (Binary Min-Heap) — Least-Cost Feasible Path
* **Purpose:** Computes the least-cost (minimum distance/travel time) route from the evacuated zone to all feasible shelters (where $\text{Available Capacity} > 0$).
* **Implementation:** Built using a genuine **Binary Min-Heap** (`MinHeap` with `insert`, `extractMin`, `bubbleUp`, `bubbleDown`, `isEmpty`), maintaining a distance table and predecessor map.
* Edge relaxation occurs whenever:
  $$\text{dist}[u] + \text{weight}(u, v) < \text{dist}[v]$$
* **Path Reconstruction:** Backtracks from the target shelter to the danger zone using the predecessor map.

---

### D. Shelter Capacity Enforcement & Partial Evacuation
* **Available Capacity:**
  $$\text{Available Capacity} = \text{Total Capacity} - \text{Current Occupancy}$$
* Convoys never exceed available capacity.
* If a zone has 120 people and the closest shelter only has 50 spaces:
  1. 50 people are allocated to the closest shelter (exhausting its capacity).
  2. The remaining 70 people trigger an automatic search for the next feasible shelter with available capacity.
  3. Capacities and occupancy statistics update in real time.

---

### E. Dynamic Road Failure & Recalculation
* When a road becomes blocked (e.g., Road $B \leftrightarrow E$ due to flood or debris):
  1. The edge is marked as `blocked = true`.
  2. The adjacency list is rebuilt without the edge.
  3. BFS re-evaluates network reachability.
  4. Dijkstra recalculates bypass routes (e.g., $A \rightarrow D \rightarrow E \rightarrow S2$).
  5. The interactive SVG map updates with red dashed lines and recalculated glowing paths.

---

## ⏱ 4. Algorithmic Complexity

| Algorithm | Data Structure | Time Complexity | Space Complexity | Hackathon Justification |
| :--- | :--- | :--- | :--- | :--- |
| **Emergency Triage** | Binary Max-Heap | $O(\log V)$ per operation | $O(V)$ | Guarantees most severe threat is addressed first. |
| **Reachability Check** | Adjacency List + FIFO Queue | $O(V + E)$ | $O(V)$ | Fast reachability pruning before running Dijkstra. |
| **Shortest Route** | Binary Min-Heap + Adjacency List | $O((V + E) \log V)$ | $O(V)$ | Optimal routing avoiding $O(V^2)$ dense matrix overhead. |

*Where $V = \text{number of nodes}$ (danger zones + junctions + shelters) and $E = \text{number of available roads}$.*

---

## 🚀 5. How to Run Locally

### Option A: Direct Browser Launch (No Dependencies)
1. Double click or open [`index.html`](file:///c:/Users/nsrfl/OneDrive/Desktop/DEP/Disaster_Evacuation_Planner/index.html) in any modern web browser (Chrome, Edge, Firefox, Brave).
2. The entire application runs client-side with pure HTML, CSS, and Vanilla JavaScript.

### Option B: Local Node Server
1. Open PowerShell or Command Prompt in the project directory:
   ```bash
   node server.js
   ```
2. Open your browser and navigate to:
   ```
   http://localhost:8080/
   ```

### Option C: Run Automated DAA Unit & Simulation Tests
To execute the automated algorithmic test suite:
```bash
node test_algorithms.js
node test_full_simulation.js
```

---

## 🎤 6. Judge & Demo Presentation Walkthrough

Follow these steps during your hackathon demo:

1. **Explain the Control Center Layout**:
   - Point out the **Total People at Risk (350)** metric, which remains constant to preserve statistical integrity.
   - Point out the **Interactive Schematic Map** with Danger Zones (Red), Transit Junctions (Indigo), and Shelters (Green).

2. **Demonstrate Step-by-Step Mode**:
   - Click the **"Step-by-Step Mode"** button.
   - **Step 1 (Risk Calculation):** Observe how Zone A, B, and C calculate their dynamic risk scores based on threat, urgency, vulnerability, and population factor.
   - **Step 2 (Heap Construction):** Observe the **Max-Heap Priority Queue** panel populate with Zone A at the top (#1, Critical).
   - **Step 3 (Extraction):** Zone A is extracted first. The log explains: *"Zone A extracted first because threat, urgency, and vulnerability yield highest emergency priority in Max-Heap."*
   - **Step 4 (BFS Reachability):** The terminal logs BFS visiting order and marks reachable vs unreachable shelters.
   - **Step 5 (Capacity & Dijkstra):** Dijkstra identifies that S1 (cost 12 km) has 50 spaces and S2 (cost 13 km) has 200 spaces.
   - **Step 6 (Multi-Shelter Allocation):** Allocates 50 to S1, and reroutes remaining 70 to S2 via $A \rightarrow D \rightarrow E \rightarrow S2$.

3. **Demonstrate Dynamic Road Failure**:
   - Click **"Simulate Road Failure (B-E)"** (or click directly on road $B \leftrightarrow E$ on the map).
   - Road $B-E$ turns into a red dashed hazard line with an $\times$ badge.
   - The terminal announces: `[Road Failure Event] Road [B ↔ E] is now BLOCKED ❌!`.
   - The engine automatically triggers graph recalculation and generates the bypass route ($A \rightarrow D \rightarrow E \rightarrow S2$).

4. **Demonstrate Custom Scenario Configuration**:
   - Click **"⚙ Scenario Config"** in the top navigation bar.
   - Modify any zone population, urgency, shelter capacity, or road cost.
   - Click **"Run Custom Scenario"** and watch the algorithms re-compute on the fly without any hard-coded results!

---

## 🏆 7. Compliance Checklist

- [x] **Priority Queue**: Implemented using a genuine Binary Max-Heap class (`MaxHeap`).
- [x] **Dynamic Risk Score**: Calculated dynamically via multi-criteria formula.
- [x] **BFS**: Implemented with FIFO queue for reachability filtering.
- [x] **Dijkstra's Algorithm**: Implemented with a genuine Binary Min-Heap (`MinHeap`).
- [x] **Predecessor Map**: Full path reconstruction from target to source.
- [x] **Capacity Constraints**: Strictly enforced; partial allocations supported.
- [x] **Failure Conditions Handled**: Unreachable shelters, full shelters, partial evacuations, and road failures.
- [x] **Dynamic Rerouting**: Road failures trigger live recalculation.
- [x] **Statistical Integrity**: Total People at Risk remains constant.
- [x] **Interactive Visualization**: SVG schematic map with animated flow pulses and interactive click toggling.
- [x] **Zero External API Dependencies**: 100% self-contained algorithmic engine.