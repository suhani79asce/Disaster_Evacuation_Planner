# 🚨 Disaster Evacuation Planner (DEP)
### *An Intelligent Multi-Tier Algorithmic Decision Engine for Disaster Response & Safe Route Planning*

[![DAA Algorithms](https://img.shields.io/badge/DAA-Priority%20Queue%20%7C%20BFS%20%7C%20Dijkstra-blue.svg)](#-4-algorithmic-deep-dive--mathematical-formulations)
[![Python](https://img.shields.io/badge/Python-3.x-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Backend-Flask-black?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Leaflet](https://img.shields.io/badge/GIS%20Mapping-Leaflet%201.9.4-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Tests](https://img.shields.io/badge/Tests-23%2F23%20Passing-brightgreen.svg)](#-9-automated-testing--verification)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Table of Contents
1. [Executive Summary & The Core Idea](#-1-executive-summary--the-core-idea)
2. [The Real-World Disaster Dilemma (Problem Statement)](#-2-the-real-world-disaster-dilemma-problem-statement)
3. [The Proposed Solution: 5-Stage Decision Funnel](#-3-the-proposed-solution-5-stage-decision-funnel)
4. [Algorithmic Deep Dive & Mathematical Formulations](#-4-algorithmic-deep-dive--mathematical-formulations)
   - [Stage 1: Multi-Factor Priority Queue (Max-Heap)](#a-stage-1-multi-factor-priority-queue-max-heap)
   - [Stage 2: Breadth-First Search (BFS Reachability & Minimum Hops)](#b-stage-2-breadth-first-search-bfs-reachability--minimum-hops)
   - [Stage 3: Shelter Capacity Validation & Infeasibility Handling](#c-stage-3-shelter-capacity-validation--infeasibility-handling)
   - [Stage 4: Dijkstra's Algorithm (Least-Cost Pathfinding)](#d-stage-4-dijkstras-algorithm-least-cost-pathfinding)
   - [Stage 5: Explainability Engine ("Why This Decision?")](#e-stage-5-explainability-engine-why-this-decision)
5. [Algorithm Comparison Matrix](#-5-algorithm-comparison-matrix)
6. [Interactive GIS Map & Dynamic Road Blockages](#-6-interactive-gis-map--dynamic-road-blockages)
7. [System Architecture & Technology Stack](#-7-system-architecture--technology-stack)
8. [Backend REST API Reference](#-8-backend-rest-api-reference)
9. [Automated Testing & Verification](#-9-automated-testing--verification)
10. [Judge & Demo Walkthrough Guide](#-10-judge--demo-walkthrough-guide)
11. [Quickstart & Installation](#-11-quickstart--installation)
12. [Project Directory Structure](#-12-project-directory-structure)

---

## 💡 1. Executive Summary & The Core Idea

During major emergencies—such as urban floods, gas leaks, structural fires, and industrial chemical spills—emergency response teams are overwhelmed with chaotic data. First responders must make split-second life-or-death decisions: **Which danger zone needs help first? Which roads are still passable? Which evacuation shelter has room? And what is the safest route to get there?**

### The Core Idea:
> **Evacuation cannot be solved by a single routing algorithm.** Routing someone along the "shortest" road is fatal if that road is underwater, the destination shelter has zero beds, or another high-casualty zone was left stranded. 
>
> The **Disaster Evacuation Planner (DEP)** solves this crisis by orchestrating **three fundamental Design and Analysis of Algorithms (DAA) paradigms** into a sequential, multi-constraint decision pipeline:
> 1. **Priority Queue (Binary Max-Heap)** determines **WHO** must be evacuated first based on a multi-attribute triage score.
> 2. **Breadth-First Search (BFS)** determines **WHERE** citizens can physically escape by traversing the open topological road graph layer-by-layer and pruning blocked links.
> 3. **Shelter Capacity Validation** verifies **WHICH** reachable shelters possess sufficient available capacity to absorb the evacuees without causing dangerous secondary stampedes.
> 4. **Dijkstra's Algorithm (Binary Min-Heap)** computes **HOW** evacuees should travel by calculating the optimal minimum-distance path to the nearest *capacity-feasible* shelter.
> 5. **Explainability Engine** reveals **WHY** every decision was made in plain English, creating full operational transparency for human emergency commanders.

---

## ⚠️ 2. The Real-World Disaster Dilemma (Problem Statement)

When a disaster strikes a metropolitan area, conventional navigation tools (like generic GPS routing) fail because they suffer from four critical blind spots:

| Dilemma | Conventional Approach Failure | DEP Algorithmic Solution |
| :--- | :--- | :--- |
| **1. The Triage Dilemma** | First-come, first-served or arbitrary dispatch. Small incidents may get help while high-casualty fires are ignored. | **Priority Queue (Max-Heap)** evaluates threat severity, population size, urgency, and vulnerability to triage danger zones objectively. |
| **2. Topological Uncertainty** | Routes drivers onto roads that are blocked by floodwaters, landslides, or fallen debris. | **Breadth-First Search (BFS)** dynamically traverses the network, strictly excluding blocked roads and identifying topological reachability. |
| **3. Shelter Overcrowding** | Sends everyone to the closest physical shelter, causing gate closures, overcrowding, and panic. | **Capacity Audit Constraint** checks `Total - Occupied >= Required Population`, rejecting full shelters and re-routing to viable alternatives. |
| **4. The "Black Box" Problem** | Automated systems output arbitrary routes without rationale, leading field commanders to distrust the AI. | **Explainability Panel** produces transparent, plain-English justifications showing exact formulas, factor weights, and rejection reasons. |

---

## 🔄 3. The Proposed Solution: 5-Stage Decision Funnel

Rather than treating routing as a black-box function, the system implements a structured **5-Stage Funnel**:

```text
                                DISASTER METRICS
               (Active Hazard Zones, Populations, Roads, Shelters)
                                       │
                                       ▼
                       FORMULA-BASED PRIORITY SCORING
         Score = 0.40(Threat) + 0.25(PopFactor) + 0.20(Urgency) + 0.15(Vuln)
                                       │
                                       ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ STAGE 1: PRIORITY QUEUE (Max-Heap)                                     │
  │ • Inserts all active zones into a Binary Max-Heap                      │
  │ • Deterministic tie-breaking: Threat > Urgency > Zone ID              │
  │ • Extracts highest-priority root node: E.g., Zone A (Score: 93.8/100)  │
  └────────────────────────────────────┬───────────────────────────────────┘
                                       │ Selected Highest-Priority Zone
                                       ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ STAGE 2: BREADTH-FIRST SEARCH (Level-Order Traversal)                  │
  │ • Explores road network hop-by-hop from the selected zone              │
  │ • Strict edge filtering: Ignores any road where status === 'blocked'   │
  │ • Discovers reachable shelters & computes minimum hop counts           │
  │ • Output: E.g., S01 (3 hops), S02 (3 hops), S03 (4 hops), S04 (4 hops) │
  └────────────────────────────────────┬───────────────────────────────────┘
                                       │ Reachable Shelters List
                                       ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ STAGE 3: SHELTER CAPACITY AUDIT (Constraint Satisfaction)              │
  │ • Computes: Available Capacity = Total Capacity - Occupied Space       │
  │ • Enforces: Available Capacity >= Zone Required Population             │
  │ • E.g., S01 Available: 150 < 320 Req ➔ REJECTED (Insufficient)        │
  │ • E.g., S02 Available: 450 >= 320 Req ➔ FEASIBLE                       │
  └────────────────────────────────────┬───────────────────────────────────┘
                                       │ Capacity-Feasible Shelters Only
                                       ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ STAGE 4: DIJKSTRA'S ALGORITHM (Min-Heap Shortest Path)                 │
  │ • Evaluates minimum road distance (km) on the open road subgraph       │
  │ • Binary Min-Heap node relaxation: dist[u] + cost(u,v) < dist[v]       │
  │ • Reconstructs optimal path via predecessor back-pointers              │
  │ • E.g., Path to S02: A ➔ J_Banjara ➔ J_Central ➔ S02 (11.6 km)         │
  └────────────────────────────────────┬───────────────────────────────────┘
                                       │ Optimal Route & Cost
                                       ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ STAGE 5: DECISION EXPLAINABILITY ENGINE                                │
  │ • Generates human-readable audit trail ("Why This Decision?")          │
  │ • Explains why Zone A was prioritized over B, C, D, E                  │
  │ • Explains why S01 was rejected despite fewer hops, and why S02 won    │
  └────────────────────────────────────┬───────────────────────────────────┘
                                       │
                                       ▼
                     FINAL DISPATCH & MAP VISUALIZATION
```

---

## 🧮 4. Algorithmic Deep Dive & Mathematical Formulations

### A. Stage 1: Multi-Factor Priority Queue (Max-Heap)

#### 1. Mathematical Formulation
To eliminate arbitrary human bias during emergency dispatch, the **Priority Score** synthesizes four vital disaster attributes into a single scalar value between $0$ and $100$:

$$\text{Priority Score} = 0.40 \cdot T + 0.25 \cdot P_{\text{norm}} + 0.20 \cdot U + 0.15 \cdot V$$

Where:
* $T \in [0, 100]$: **Threat Severity** (hazard intensity, e.g., five-alarm fire vs minor waterlogging).
* $P_{\text{norm}} \in [0, 100]$: **Normalized Relative Population Factor**, scaled relative to the maximum population among currently active hazard zones:
  $$P_{\text{norm}} = \left( \frac{\text{Zone Population}}{\max_{z \in \text{Active Zones}}(\text{Population}_z)} \right) \times 100$$
  *Why relative normalization?* This ensures that zones with dense populations elevate triage urgency dynamically without being drowned out by static hardcoded scales.
* $U \in [0, 100]$: **Time Urgency** (rate of hazard expansion and window to structural collapse).
* $V \in [0, 100]$: **Vulnerability Factor** (presence of elderly, pediatric, mobility-impaired, or medical facilities).

#### 2. Deterministic Tie-Breaking
When two zones have identical rounded priority scores, the heap resolves conflicts deterministically using a multi-tier fallback:
1. Higher **Threat Severity** ($T$)
2. Higher **Time Urgency** ($U$)
3. Lexicographical / Alphabetical **Zone ID** ($A < B < C$)

#### 3. Data Structure & Complexity
* Implemented as an in-memory **Binary Max-Heap** with array representation:
  - Parent index: $\lfloor(i - 1) / 2\rfloor$
  - Left child: $2i + 1$, Right child: $2i + 2$
* **Time Complexity:**
  - Heapify / Build Heap: $O(N)$
  - Insertion (`insert`): $O(\log N)$
  - Max Extraction (`extractMax`): $O(\log N)$
* **Space Complexity:** $O(N)$ where $N$ is the number of active hazard zones.

---

### B. Stage 2: Breadth-First Search (BFS Reachability & Minimum Hops)

#### 1. Why BFS Before Dijkstra?
Dijkstra's algorithm optimizes for total metric distance (edge weights like kilometers or drive time). However, in disaster logistics, **topological connectivity must precede geometric optimization**:
* If a shelter is 2 km away but disconnected due to broken bridges, Dijkstra will fail or explore uselessly without a bounded reachability check.
* BFS provides **unweighted minimum-hop analysis**, informing dispatchers of the minimum number of road intersections/checkpoints an evacuation convoy must navigate.

#### 2. Dynamic Road Blockage Filtering
BFS strictly ignores all roads flagged as blocked:
```javascript
// Edge traversal condition
if (road.status === 'blocked' || road.blocked === true) {
    continue; // Prune blocked edge from exploration graph
}
```

#### 3. Algorithm Steps
1. Push starting disaster zone $z$ to a FIFO queue $\mathcal{Q}$ at Level $0$. Mark $z$ as visited.
2. Dequeue node $u$. For each neighbor $v$ connected via an unblocked road:
   - If $v$ is unvisited: mark visited, set $\text{hop}[v] = \text{hop}[u] + 1$, and enqueue $v$.
   - If $v$ is an evacuation shelter: record $v$ in $\text{ReachableShelters}$ with its hop distance.
3. Terminate when $\mathcal{Q}$ is empty.

* **Time Complexity:** $O(V + E)$ where $V$ is junctions/shelters and $E$ is open road segments.
* **Space Complexity:** $O(V)$ for queue and visited set.

---

### C. Stage 3: Shelter Capacity Validation & Infeasibility Handling

Finding a physically reachable shelter is useless if the shelter is already at full capacity. Sending hundreds of panic-stricken evacuees to an overcrowded facility triggers secondary humanitarian crises.

#### 1. Mathematical Formulation
For each reachable shelter $S_i$:
$$\text{Available Capacity}(S_i) = \text{Total Capacity}(S_i) - \text{Occupied Space}(S_i)$$

A shelter is classified as **FEASIBLE** if and only if:
$$\text{Available Capacity}(S_i) \ge \text{Required Zone Population}$$

#### 2. Infeasibility Handling & Rejection Rationale
* If $\text{Available Capacity}(S_i) < \text{Required Population}$, the shelter status is flagged as **`REJECTED / INFEASIBLE`**.
* The system logs a human-readable rejection reason:
  $$\text{"Insufficient capacity: Required } X > \text{Available } Y\text{"}$$
* Only the subset of shelters satisfying the feasibility constraint are passed to Stage 4.

---

### D. Stage 4: Dijkstra's Algorithm (Least-Cost Pathfinding)

#### 1. Objective
Among all shelters that are both **topologically reachable** (via BFS) and **capacity-feasible** (via Capacity Audit), find the shelter $S^*$ and route $\mathcal{P}^*$ that minimizes total physical road travel distance (km).

#### 2. Algorithm & Priority Queue Relaxation
* Uses a **Binary Min-Heap** where heap entries are tuples `(distance, node_id)`.
* Initial distances: $\text{dist}[start] = 0$, and $\text{dist}[v] = \infty$ for all $v \neq start$.
* Relaxation step for open edge $(u, v)$ with weight $w(u, v)$:
  $$\text{if } \text{dist}[u] + w(u, v) < \text{dist}[v] \implies \begin{cases} \text{dist}[v] = \text{dist}[u] + w(u, v) \\ \text{prev}[v] = u \\ \text{MinHeap.insert}(( \text{dist}[v], v )) \end{cases}$$
* **Path Reconstruction:** Once destination $S^*$ is relaxed, the exact sequence of road segments is reconstructed by backtracking from $S^*$ through the predecessor map $\text{prev}[v]$ back to $start$.

* **Time Complexity:** $O((V + E) \log V)$ using a binary min-heap.
* **Space Complexity:** $O(V + E)$ for adjacency representation and predecessor tracking.

---

### E. Stage 5: Explainability Engine ("Why This Decision?")

Field commanders will not trust automated emergency recommendations unless they understand the underlying rationale. The DEP system generates transparent narrative breakdowns directly from the algorithmic execution state:

```text
╔════════════════════════════════════════════════════════════════════════════╗
║                      WHY ZONE A WAS PRIORITIZED                            ║
╠════════════════════════════════════════════════════════════════════════════╣
║ • Threat Severity:    95 / 100  (Weight: 40%) -> Contributes: 38.00        ║
║ • Population Factor: 100 / 100  (Weight: 25%) -> Contributes: 25.00        ║
║ • Time Urgency:       90 / 100  (Weight: 20%) -> Contributes: 18.00        ║
║ • Vulnerability:      85 / 100  (Weight: 15%) -> Contributes: 12.75        ║
║                                                                            ║
║ Total Priority Score: 93.8 / 100                                           ║
║ Narrative: Zone A has the highest composite score across all active        ║
║ hazard zones, placing it at the root of the Max-Heap.                      ║
╚════════════════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════════════════╗
║                      WHY SHELTER S02 WAS SELECTED                          ║
╠════════════════════════════════════════════════════════════════════════════╣
║ • Shelter S01: Available 150 | Required 320 -> REJECTED (Insufficient)     ║
║ • Shelter S02: Available 450 | Required 320 -> FEASIBLE (Cost: 11.6 km)    ║
║ • Shelter S03: Available 100 | Required 320 -> REJECTED (Insufficient)     ║
║ • Shelter S04: Available 650 | Required 320 -> FEASIBLE (Cost: 16.5 km)    ║
║                                                                            ║
║ Narrative: S02 was selected because it is reachable via BFS (3 hops),     ║
║ has sufficient capacity (450 >= 320), and provides the lowest travel       ║
║ distance (11.6 km vs 16.5 km for S04). S01 was rejected due to lack of     ║
║ space despite being physically closer in hop count.                        ║
╚════════════════════════════════════════════════════════════════════════════╝
```

---

## 📊 5. Algorithm Comparison Matrix

This table synthesizes the distinct theoretical and practical roles of each algorithm in the system:

| Metric / Dimension | Priority Queue (Max-Heap) | Breadth-First Search (BFS) | Dijkstra's Algorithm |
| :--- | :--- | :--- | :--- |
| **Core Problem Solved** | **Triage / Urgency:** *Who needs evacuation first?* | **Reachability:** *Where can evacuees physically travel?* | **Route Optimization:** *What is the least-cost path?* |
| **Primary Data Structure** | Binary Max-Heap array | FIFO Queue (`deque`) + Visited Set | Binary Min-Heap + Adjacency List |
| **Edge Weights** | Not Applicable (Node attribute scoring) | Unweighted (all edges treated as 1 hop) | Non-negative edge weights (road distance in km) |
| **Time Complexity** | $O(N \log N)$ to process $N$ disaster zones | $O(V + E)$ where $E$ is unblocked edges | $O((V + E) \log V)$ with binary heap |
| **Space Complexity** | $O(N)$ | $O(V)$ | $O(V + E)$ |
| **Handling of Road Failures** | Independent (evaluates hazard intensity) | Dynamically ignores blocked edges during expansion | Dynamically re-relaxes shortest path around blocked links |
| **Real-World Disaster Role** | Decides hospital/fire dispatch priority | Proves physical escape corridor viability | Generates turn-by-turn convoy navigation instructions |

---

## 🗺 6. Interactive GIS Map & Dynamic Road Blockages

The visualizer embeds an interactive **Leaflet.js** map styled with high-contrast **CartoDB Positron tiles**, geographically situated in the **Hyderabad Metro Emergency Operations Corridor**:

```text
    [S01: Secunderabad] ─── (5.2 km) ─── [J_Secunderabad]
            │                                  │
         (4.8 km)                           (3.9 km)
            │                                  │
    [J_Central (Secretariat)] ── (3.6 km) ── [J_Banjara] ── (4.2 km) ── [Zone A: Banjara Fire]
            │                                  │
         (3.8 km)                           (5.1 km)
            │                                  │
    [S02: Gachibowli Stadium] ── (3.5 km) ── [J_Hitec] ──── (4.0 km) ── [Zone B: Hitec Gas Leak]
```

### Map Features:
* **Disaster Pins (Red):** Display hazard type icons (🔥 Fire, ⚠️ Gas Leak, 🌊 Flood, 🏢 Collapse) and Priority Score badges. Clicking opens a comprehensive triage factor popup.
* **Shelter Pins (Green):** Display capacity occupancy rings and live availability badges (`Feasible` vs `Full/Rejected`).
* **Transit Junctions (Slate Circles):** Key highway interchanges connecting zones to shelters.
* **Open Roads (Solid Slate Polyline):** Real road corridors showing distance in km.
* **Dynamic Road Clicking:** **Clicking any road segment on the map instantly toggles its status between `open` and `blocked`!**
* **Blocked Roads (Dashed Red Lines):** Visually pulse with hazard tooltips. When a road is blocked, both BFS and Dijkstra immediately recalculate and re-route in real-time.
* **Optimal Route Polyline (Glowing Blue):** Highlights the active Dijkstra path to the designated shelter.
* **BFS Reachability Aura:** Discovered nodes pulse with blue concentric halo circles during BFS step-by-step traversal.

---

## 🏗 7. System Architecture & Technology Stack

The project is structured with strict separation of concerns, providing full algorithmic execution on both **Python / Flask** and **pure JavaScript**:

```text
├── Backend API (Python & Flask / Node.js)
│   ├── Pure Python algorithms (heapq, collections.deque)
│   ├── REST endpoints for calculations & full pipeline
│   └── Static asset delivery & fallback port handling
│
├── GIS Mapping Layer (Leaflet 1.9.4)
│   ├── CartoDB Positron vector tiles
│   ├── Dynamic marker layers, custom SVG icons, popups
│   └── Interactive click-to-block road listeners
│
└── Frontend Engine (Vanilla JS + CSS3 + HTML5)
    ├── High-performance DOM caching & state manager
    ├── Responsive Light Command Center UI
    ├── Interactive visualizer tabs (PQ, BFS, Dijkstra)
    └── Plain-English decision rationale generator
```

### Technology Breakdown:
* **Backend:** Python 3 + Flask ([`app.py`](app.py)) with fallback zero-dependency Node.js server ([`server.js`](server.js)).
* **GIS Mapping:** Leaflet 1.9.4 with CartoDB Positron basemap.
* **Frontend:** HTML5, Modern CSS3 with CSS variables and responsive glassmorphism panels, Vanilla JavaScript ES6+ (no bulky framework overhead, instant 60fps interaction).

---

## 🔌 8. Backend REST API Reference

The Flask backend ([`app.py`](app.py)) and Node server ([`server.js`](server.js)) expose identical REST API contracts:

### 1. `POST /calculate-priority`
Calculates normalized Priority Scores for an array of disaster zones.
* **Request:** `{"zones": [{"id": "A", "threat": 95, "population": 320, "urgency": 90, "vulnerability": 85}]}`
* **Response:**
  ```json
  {
    "success": true,
    "scores": [{ "id": "A", "priority_score": 93.8, "breakdown": { "threat": 95, "pop_factor": 100, "urgency": 90, "vuln": 85 } }]
  }
  ```

### 2. `POST /priority-queue`
Inserts zones into a Binary Max-Heap and returns the deterministic extraction order.
* **Response:**
  ```json
  {
    "success": true,
    "extraction_order": [
      { "id": "A", "priority_score": 93.8 },
      { "id": "B", "priority_score": 83.9 },
      { "id": "C", "priority_score": 75.6 }
    ]
  }
  ```

### 3. `POST /bfs`
Executes level-order traversal from a source zone, omitting blocked roads.
* **Response:**
  ```json
  {
    "success": true,
    "reachable_shelters": [{ "id": "S01", "hops": 3 }, { "id": "S02", "hops": 3 }],
    "minimum_hop_shelter": "S01",
    "minimum_hops": 3,
    "levels": { "0": ["A"], "1": ["J_Banjara", "J_Hitec"], "2": ["J_Central"], "3": ["S01", "S02"] }
  }
  ```

### 4. `POST /dijkstra`
Runs Min-Heap Dijkstra to find shortest distance paths to capacity-feasible shelters.
* **Response:**
  ```json
  {
    "success": true,
    "target_shelter": "S02",
    "total_cost": 11.6,
    "route": ["A", "J_Banjara", "J_Central", "S02"],
    "tentative_costs": { "A": 0.0, "J_Banjara": 4.2, "J_Central": 7.8, "S02": 11.6 }
  }
  ```

### 5. `POST /evacuation-plan`
Executes the unified 5-stage pipeline and returns the complete decision model including plain-English explanation.

---

## 🧪 9. Automated Testing & Verification

The project includes dual automated test suites validating all algorithmic invariants and the end-to-end simulation pipeline:

```bash
# Run DAA Algorithm Unit Tests
node test_algorithms.js

# Run Full Simulation & Invariant Validation Tests
node test_full_simulation.js
```

### Test Coverage Summary:
* `[PASS]` Priority score computation with exact weight contributions ($0.40, 0.25, 0.20, 0.15$).
* `[PASS]` Population factor normalized relative to maximum active population.
* `[PASS]` Binary Max-Heap insertion, bubble-up, and bubble-down invariants.
* `[PASS]` Deterministic tie-breaking across identical priority scores.
* `[PASS]` BFS level-order traversal and hop counting.
* `[PASS]` Strict omission of blocked road segments during BFS exploration.
* `[PASS]` Shelter capacity validation inequality (`Available >= Required`).
* `[PASS]` Dijkstra least-cost pathfinding and correct edge relaxation.
* `[PASS]` Backtracking path reconstruction from predecessor map.
* `[PASS]` Real-time re-routing upon simulated road blockage.
* **Total: 23 / 23 Tests Passing (100% Pass Rate).**

---

## 🎯 10. Judge & Demo Walkthrough Guide

Follow these steps to demonstrate the full algorithmic decision pipeline to an evaluator or judge:

1. **Step 1: Inspect the Priority Queue (Who goes first?)**
   - Direct attention to the **Active Emergencies** list and the **Priority Queue Table**.
   - Point out **Zone A** (Banjara Hills Fire, 320 people, severity 95) at the top with a score of **93.8 / 100**.
   - Show that **Zone E** (severity 40) is at the bottom with a score of **36.0 / 100**.
   - *Key takeaway:* Disaster zones are ordered by a mathematically grounded multi-attribute Max-Heap, not arbitrary choice.

2. **Step 2: Run BFS Reachability (Where can they go?)**
   - Click the **"RUN BFS"** button (or open the BFS tab in the visualizer).
   - Observe the step-by-step level expansion: Level 0 (Zone A) $\rightarrow$ Level 1 (Junctions) $\rightarrow$ Level 2 (Central Hub) $\rightarrow$ Level 3 (Shelters S01 & S02).
   - Point out that BFS identifies **S01 as the minimum-hop shelter (3 hops)**.

3. **Step 3: Observe Shelter Capacity Audit (Why is S01 rejected?)**
   - Look at the **Safe Shelters** panel and the **"Why This Decision?"** explainer.
   - Point out that **Shelter S01 is REJECTED** even though it is the closest in hops (3 hops), because its available capacity is only **150 spaces**, while Zone A requires **320 spaces**.
   - Point out that **Shelter S02 has 450 available spaces** and is marked **FEASIBLE**.

4. **Step 4: Run Dijkstra Pathfinding (How should they travel?)**
   - Click **"RUN DIJKSTRA"**.
   - The visualizer displays the node relaxation steps and tentative costs table.
   - The map draws a glowing blue polyline along `Zone A → J_Banjara → J_Central → S02` with a total distance cost of **11.6 km**.

5. **Step 5: Demonstrate Dynamic Road Failure (Real-Time Rerouting)**
   - Click directly on the road between `J_Banjara` and `J_Central` on the Leaflet map (or click **"Simulate Road Failure"** in the sidebar).
   - The road immediately turns into a red dashed line marked `BLOCKED`.
   - Without refreshing the page, the system re-runs: BFS confirms alternative paths, and Dijkstra immediately calculates an alternative bypass route (e.g., via `J_Hitec` $\rightarrow$ `S02`)!

---

## ⚡ 11. Quickstart & Installation

### Option 1: Python & Flask Backend (Recommended)
1. Ensure Python 3.8+ is installed.
2. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```
3. Launch the application:
   ```bash
   python app.py
   ```
4. Open your browser at:
   ```
   http://127.0.0.1:5000/
   ```

### Option 2: Lightweight Node.js Server
1. Ensure Node.js is installed.
2. Launch the server (zero external dependencies required):
   ```bash
   node server.js
   ```
3. Open your browser at:
   ```
   http://localhost:8080/
   ```

---

## 📁 12. Project Directory Structure

```text
Disaster_Evacuation_Planner/
├── index.html               # Main Light Command Center Dashboard UI
├── app.py                   # Python + Flask Server with REST APIs & static hosting
├── server.js                # High-performance Node.js alternative server
├── requirements.txt         # Python dependencies (Flask >= 3.0.0)
│
├── css/
│   └── style.css            # Light theme command center styling & responsive grid
│
├── js/
│   ├── algorithms.js        # Core DAA Implementations:
│   │                        #  - PriorityQueue (Binary Max-Heap with tie-breaking)
│   │                        #  - runBFS (Level-order traversal & hop counting)
│   │                        #  - runDijkstra (Binary Min-Heap shortest path)
│   │                        #  - validateShelterCapacity (Available capacity audit)
│   │                        #  - generateDecisionExplanation (Plain-English audit)
│   ├── app.js               # Application Controller & UI event coordinator
│   ├── data.js              # Hyderabad Metro Emergency Corridor data model
│   └── map.js               # Leaflet 1.9.4 GIS map engine with click-to-block handlers
│
├── test_algorithms.js       # DAA algorithm unit test suite
├── test_full_simulation.js  # End-to-end integration and invariant test suite
└── README.md                # Comprehensive documentation & evaluation guide
```

---

## 👨‍💻 Authors & Academic Context
* **Project:** Disaster Evacuation Planner (DEP)
* **Domain:** Design and Analysis of Algorithms (DAA) / Smart City Disaster Management
* **Focus Areas:** Graph Theory, Heap Data Structures, Constraint Satisfaction, Real-Time GIS Mapping, Algorithmic Transparency.