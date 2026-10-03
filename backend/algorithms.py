"""
Disaster Evacuation Planner - DAA Algorithms
Pure Python implementations of:
1. Dynamic Priority Score calculation (Threat, Relative PopFactor, Urgency, Vulnerability)
2. Priority Queue using heapq with deterministic tie-breaking (Threat -> Urgency -> Zone ID)
3. Breadth-First Search (BFS) reachability & minimum-hop analysis using collections.deque
4. Dijkstra's Algorithm with Binary Min-Heap & predecessor path reconstruction
5. Shelter Capacity Validation & Infeasibility handling
6. Automated Plain-English Explainer ("Why This Decision?")
"""

import heapq
from collections import deque
from typing import Dict, List, Tuple, Set, Optional, Any

# ==========================================
# 1. PRIORITY SCORE CALCULATION
# ==========================================

def calculate_priority_score(zone: Dict[str, Any], max_population: float = 100.0) -> Dict[str, Any]:
    """
    Priority Score = 0.40 * Threat + 0.25 * PopFactor + 0.20 * Urgency + 0.15 * Vulnerability
    where PopFactor = (Zone Population / Maximum Affected Population) * 100
    All components normalized to [0, 100].
    """
    threat = float(zone.get("threatSeverity", zone.get("threat_severity", 80)))
    raw_pop = float(zone.get("remaining", zone.get("population", 100)))
    urgency = float(zone.get("timeUrgency", zone.get("time_urgency", 75)))
    vulnerability = float(zone.get("vulnerability", 70))

    denom = max(1.0, float(max_population))
    pop_factor = min(100.0, max(0.0, (raw_pop / denom) * 100.0))

    raw_score = (0.40 * threat) + (0.25 * pop_factor) + (0.20 * urgency) + (0.15 * vulnerability)
    score = round(raw_score, 1)

    if score >= 90:
        level = "CRITICAL"
        badge = "badge-critical"
    elif score >= 75:
        level = "HIGH"
        badge = "badge-high"
    elif score >= 50:
        level = "MEDIUM"
        badge = "badge-medium"
    else:
        level = "LOW"
        badge = "badge-low"

    return {
        "risk_score": score,
        "priority_score": score,
        "pop_factor": round(pop_factor, 1),
        "threat": round(threat, 1),
        "urgency": round(urgency, 1),
        "vulnerability": round(vulnerability, 1),
        "priority_level": level,
        "badge_class": badge,
        "breakdown": {
            "threat": round(threat, 1),
            "population_factor": round(pop_factor, 1),
            "urgency": round(urgency, 1),
            "vulnerability": round(vulnerability, 1)
        },
        "formula": f"0.40×{threat:.0f} + 0.25×{pop_factor:.1f} + 0.20×{urgency:.0f} + 0.15×{vulnerability:.0f}"
    }


# ==========================================
# 2. PRIORITY QUEUE (MAX-HEAP WITH TIE-BREAKING)
# ==========================================

class PriorityQueue:
    """
    Binary Max-Heap implemented via heapq with inverted keys.
    Deterministic tie-breaking:
    1. Higher Priority Score
    2. Higher Threat Severity
    3. Higher Time Urgency
    4. Smaller/Alphabetical Zone ID
    """
    def __init__(self):
        self._heap = []
        self._count = 0

    def insert(self, zone: Dict[str, Any]):
        score = float(zone.get("priorityScore", zone.get("priority_score", 0)))
        threat = float(zone.get("threatSeverity", zone.get("threat_severity", 0)))
        urgency = float(zone.get("timeUrgency", zone.get("time_urgency", 0)))
        zone_id = str(zone.get("id", ""))

        # Negate values for max-heap behavior; zone_id remains alphabetical
        key = (-score, -threat, -urgency, zone_id, self._count)
        heapq.heappush(self._heap, (key, zone))
        self._count += 1

    def extract_max(self) -> Optional[Dict[str, Any]]:
        if not self._heap:
            return None
        _, zone = heapq.heappop(self._heap)
        return zone

    def peek(self) -> Optional[Dict[str, Any]]:
        if not self._heap:
            return None
        return self._heap[0][1]

    def is_empty(self) -> bool:
        return len(self._heap) == 0

    def __len__(self) -> int:
        return len(self._heap)


# ==========================================
# 3. GRAPH REPRESENTATION & BLOCKED ROAD HANDLING
# ==========================================

def build_graph(roads: List[Dict[str, Any]], all_nodes: Optional[List[str]] = None) -> Dict[str, List[Dict[str, Any]]]:
    """
    Constructs an undirected adjacency list from road network.
    Blocked roads (blocked == True or status == 'blocked') are strictly ignored.
    """
    graph: Dict[str, List[Dict[str, Any]]] = {}

    if all_nodes:
        for node in all_nodes:
            graph[node] = []

    for road in roads:
        is_blocked = road.get("blocked", False) or road.get("status") == "blocked"
        if is_blocked:
            continue

        u = road.get("source", road.get("from"))
        v = road.get("destination", road.get("to"))
        cost = float(road.get("cost", 1.0))
        road_id = road.get("id", f"{u}-{v}")

        if not u or not v:
            continue

        if u not in graph:
            graph[u] = []
        if v not in graph:
            graph[v] = []

        graph[u].append({"node": v, "cost": cost, "id": road_id})
        graph[v].append({"node": u, "cost": cost, "id": road_id})

    return graph


# ==========================================
# 4. BREADTH-FIRST SEARCH (BFS)
# ==========================================

def run_bfs(
    graph: Dict[str, List[Dict[str, Any]]],
    start_node: str,
    shelter_ids: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Level-by-level BFS traversal exploring only open roads.
    Determines topological reachability and minimum hops to each shelter.
    Uses collections.deque as the FIFO queue.
    """
    if start_node not in graph:
        return {
            "reachable_nodes": [start_node],
            "reachable_shelters": [],
            "minimum_hop_shelter": None,
            "minimum_hops": float("inf"),
            "levels": {0: [start_node]},
            "visited_order": [start_node],
            "hop_counts": {start_node: 0},
            "parent_map": {start_node: None}
        }

    visited: Set[str] = {start_node}
    queue = deque([start_node])
    hop_counts: Dict[str, int] = {start_node: 0}
    parent_map: Dict[str, Optional[str]] = {start_node: None}
    visited_order: List[str] = [start_node]
    levels: Dict[int, List[str]] = {0: [start_node]}

    shelter_set = set(shelter_ids) if shelter_ids else set()

    while queue:
        curr = queue.popleft()
        curr_hops = hop_counts[curr]

        for edge in graph.get(curr, []):
            nbr = edge["node"]
            if nbr not in visited:
                visited.add(nbr)
                visited_order.append(nbr)
                parent_map[nbr] = curr
                next_hops = curr_hops + 1
                hop_counts[nbr] = next_hops

                if next_hops not in levels:
                    levels[next_hops] = []
                levels[next_hops].append(nbr)

                queue.append(nbr)

    reachable_shelters = []
    min_hop_shelter = None
    min_hops = float("inf")

    for s_id in sorted(shelter_set):
        if s_id in visited:
            hops = hop_counts[s_id]
            reachable_shelters.append({"id": s_id, "hops": hops})
            if hops < min_hops:
                min_hops = hops
                min_hop_shelter = s_id

    return {
        "reachable_nodes": list(visited),
        "reachable_shelters": reachable_shelters,
        "minimum_hop_shelter": min_hop_shelter,
        "minimum_hops": min_hops if min_hops != float("inf") else None,
        "levels": levels,
        "visited_order": visited_order,
        "hop_counts": hop_counts,
        "parent_map": parent_map
    }


# ==========================================
# 5. DIJKSTRA'S ALGORITHM (BINARY MIN-HEAP)
# ==========================================

def run_dijkstra(
    graph: Dict[str, List[Dict[str, Any]]],
    start_node: str,
    target_node: Optional[str] = None
) -> Dict[str, Any]:
    """
    Computes minimum-cost routes using a Binary Min-Heap (heapq).
    Maintains tentative costs, predecessor pointers, and relaxation steps.
    """
    dist: Dict[str, float] = {node: float("inf") for node in graph}
    prev: Dict[str, Optional[str]] = {node: None for node in graph}

    dist[start_node] = 0.0
    pq = [(0.0, start_node)]

    visited_order: List[str] = []
    relaxation_steps: List[Dict[str, Any]] = []
    finalized: Set[str] = set()

    while pq:
        d, u = heapq.heappop(pq)

        if u in finalized:
            continue
        finalized.add(u)
        visited_order.append(u)

        if target_node and u == target_node:
            break

        for edge in graph.get(u, []):
            v = edge["node"]
            weight = edge["cost"]

            if v not in finalized:
                new_dist = d + weight
                if new_dist < dist.get(v, float("inf")):
                    relaxation_steps.append({
                        "from": u,
                        "to": v,
                        "old_dist": dist.get(v) if dist.get(v) != float("inf") else None,
                        "new_dist": new_dist,
                        "weight": weight
                    })
                    dist[v] = new_dist
                    prev[v] = u
                    heapq.heappush(pq, (new_dist, v))

    path: List[str] = []
    cost = float("inf")

    if target_node:
        cost = dist.get(target_node, float("inf"))
        if cost != float("inf"):
            path = reconstruct_path(prev, start_node, target_node)

    clean_dist = {k: (round(v, 2) if v != float("inf") else None) for k, v in dist.items()}

    return {
        "dist": clean_dist,
        "prev": prev,
        "cost": round(cost, 2) if cost != float("inf") else None,
        "path": path,
        "visited_order": visited_order,
        "relaxation_steps": relaxation_steps
    }


def reconstruct_path(prev_map: Dict[str, Optional[str]], start_node: str, target_node: str) -> List[str]:
    path = []
    curr = target_node

    while curr is not None:
        path.append(curr)
        if curr == start_node:
            break
        curr = prev_map.get(curr)

    if not path or path[-1] != start_node:
        return []

    path.reverse()
    return path


# ==========================================
# 6. SHELTER CAPACITY & COMPLETE PIPELINE
# ==========================================

def get_available_capacity(shelter: Dict[str, Any]) -> int:
    total = int(shelter.get("totalCapacity", shelter.get("total_capacity", 0)))
    occupied = int(shelter.get("currentOccupancy", shelter.get("occupied_capacity", 0)))
    return max(0, total - occupied)


def evaluate_zone_shelter_options(
    zone: Dict[str, Any],
    all_shelters: List[Dict[str, Any]],
    graph: Dict[str, List[Dict[str, Any]]],
    all_zones: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Complete integrated DAA pipeline:
    1. Priority Score calculation & factor normalization.
    2. BFS reachability & minimum hops.
    3. Shelter capacity validation (rejection of insufficient capacity shelters).
    4. Dijkstra minimum-cost routing to feasible shelters.
    5. Plain-English Explanation generation ("Why This Decision?").
    """
    if all_zones:
        max_pop = max((float(z.get("population", 0)) for z in all_zones), default=100.0)
    else:
        max_pop = float(zone.get("population", 100.0))

    priority_result = calculate_priority_score(zone, max_pop)
    required_pop = int(zone.get("remaining", zone.get("population", 0)))
    shelter_ids = [s["id"] for s in all_shelters]

    # Step 1: Run BFS
    bfs_result = run_bfs(graph, zone["id"], shelter_ids)
    reachable_set = set(bfs_result["reachable_nodes"])

    # Step 2: Audit every shelter
    shelters_audit = {}
    feasible_shelters = []
    rejected_shelters = []

    for s in all_shelters:
        s_id = s["id"]
        is_reachable = s_id in reachable_set
        avail = get_available_capacity(s)
        has_capacity = avail >= required_pop
        is_feasible = is_reachable and has_capacity

        if not is_reachable:
            reason = "Unreachable (BFS: No open road path)"
        elif not has_capacity:
            reason = f"Insufficient capacity: Required {required_pop} > Available {avail}"
        else:
            reason = "Feasible"

        audit_entry = {
            "id": s_id,
            "name": s["name"],
            "total_capacity": int(s.get("totalCapacity", 0)),
            "occupied_capacity": int(s.get("currentOccupancy", 0)),
            "available_capacity": avail,
            "required_population": required_pop,
            "reachable": is_reachable,
            "feasible": is_feasible,
            "reason": reason
        }

        shelters_audit[s_id] = audit_entry

        if is_feasible:
            feasible_shelters.append(s)
        else:
            rejected_shelters.append(audit_entry)

    # Step 3: Run Dijkstra to feasible candidates
    candidates = feasible_shelters if feasible_shelters else [
        s for s in all_shelters if s["id"] in reachable_set and get_available_capacity(s) > 0
    ]

    shelter_routes = []
    for s in candidates:
        dijkstra_res = run_dijkstra(graph, zone["id"], s["id"])
        if dijkstra_res["cost"] is not None and dijkstra_res["path"]:
            shelter_routes.append({
                "shelter": s,
                "cost": dijkstra_res["cost"],
                "path": dijkstra_res["path"],
                "available_capacity": get_available_capacity(s),
                "dijkstra_result": dijkstra_res,
                "is_fully_feasible": s in feasible_shelters
            })

    # Sort by lowest Dijkstra travel cost
    shelter_routes.sort(key=lambda x: x["cost"])
    best_option = shelter_routes[0] if shelter_routes else None

    # Step 4: Construct "Why This Decision?" Explanation
    z_name = zone.get("name", f"Zone {zone['id']}")
    bd = priority_result["breakdown"]

    why_zone = (
        f"{z_name} was prioritized with a Priority Score of {priority_result['risk_score']}/100 "
        f"(Threat: {bd['threat']}/100, Pop Factor: {bd['population_factor']}/100, "
        f"Urgency: {bd['urgency']}/100, Vulnerability: {bd['vulnerability']}/100). "
        f"It occupies the root of the Binary Max-Heap because it represents the highest multi-factor emergency risk."
    )

    if best_option:
        s_obj = best_option["shelter"]
        hops = bfs_result["hop_counts"].get(s_obj["id"], 0)
        why_shelter = (
            f"Shelter {s_obj['id']} ({s_obj['name']}) was selected because it is verified reachable via BFS ({hops} hops), "
            f"possesses sufficient capacity ({best_option['available_capacity']} available >= {required_pop} required), "
            f"and achieves the minimum Dijkstra road travel cost ({best_option['cost']:.1f} km). "
            f"Other shelters were either unreachable due to blocked roads or rejected due to capacity limits."
        )
    else:
        why_shelter = (
            f"No shelter could be selected for {z_name}: all candidate shelters are either physically "
            f"unreachable due to road blockages or lack sufficient capacity."
        )

    return {
        "selected_zone": zone["id"],
        "zone": zone,
        "priority_score": priority_result["risk_score"],
        "priority_level": priority_result["priority_level"],
        "priority_breakdown": priority_result["breakdown"],
        "bfs": {
            "reachable_shelters": bfs_result["reachable_shelters"],
            "minimum_hop_shelter": bfs_result["minimum_hop_shelter"],
            "minimum_hops": bfs_result["minimum_hops"],
            "levels": bfs_result["levels"],
            "visit_order": bfs_result["visited_order"]
        },
        "shelters": shelters_audit,
        "feasible_shelters": [s["id"] for s in feasible_shelters],
        "rejected_shelters": rejected_shelters,
        "best_option": {
            "shelter_id": best_option["shelter"]["id"],
            "shelter_name": best_option["shelter"]["name"],
            "cost": best_option["cost"],
            "path": best_option["path"]
        } if best_option else None,
        "dijkstra": {
            "target_shelter": best_option["shelter"]["id"],
            "route": best_option["path"],
            "total_cost": best_option["cost"],
            "visited_order": best_option["dijkstra_result"]["visited_order"],
            "tentative_costs": best_option["dijkstra_result"]["dist"]
        } if best_option else None,
        "explanation": {
            "why_zone_prioritized": why_zone,
            "why_shelter_selected": why_shelter
        }
    }
