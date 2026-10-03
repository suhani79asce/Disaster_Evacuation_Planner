"""
Disaster Evacuation Planner - Flask API & Web Server
Technology: Python, Flask
"""

import os
import heapq
from collections import deque
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder=".", static_url_path="")

# ==========================================
# 1. CORE DATA
# ==========================================

ZONES = [
    {
        "id": "A",
        "name": "Zone A",
        "type": "Fire",
        "icon": "🔥",
        "severityLabel": "CRITICAL",
        "severityClass": "badge-critical",
        "population": 320,
        "threatSeverity": 95,
        "timeUrgency": 90,
        "vulnerability": 85,
        "priorityScore": 93.8,
        "remaining": 320
    },
    {
        "id": "C",
        "name": "Zone C",
        "type": "Flood",
        "icon": "🌊",
        "severityLabel": "HIGH",
        "severityClass": "badge-orange",
        "population": 180,
        "threatSeverity": 80,
        "timeUrgency": 75,
        "vulnerability": 70,
        "priorityScore": 71.5,
        "remaining": 180
    },
    {
        "id": "D",
        "name": "Zone D",
        "type": "Accident",
        "icon": "🚗",
        "severityLabel": "HIGH",
        "severityClass": "badge-orange",
        "population": 120,
        "threatSeverity": 75,
        "timeUrgency": 70,
        "vulnerability": 65,
        "priorityScore": 63.3,
        "remaining": 120
    },
    {
        "id": "B",
        "name": "Zone B",
        "type": "Gas Leak",
        "icon": "💨",
        "severityLabel": "MEDIUM",
        "severityClass": "badge-yellow",
        "population": 90,
        "threatSeverity": 60,
        "timeUrgency": 55,
        "vulnerability": 50,
        "priorityScore": 49.5,
        "remaining": 90
    },
    {
        "id": "E",
        "name": "Zone E",
        "type": "Building Collapse",
        "icon": "🏚",
        "severityLabel": "LOW",
        "severityClass": "badge-green",
        "population": 60,
        "threatSeverity": 40,
        "timeUrgency": 45,
        "vulnerability": 40,
        "priorityScore": 36.0,
        "remaining": 60
    }
]

SHELTERS = [
    {
        "id": "S01",
        "name": "Shelter S01 (Community Hall)",
        "totalCapacity": 180,
        "currentOccupancy": 30,
        "availableCapacity": 150,
        "location": {"lat": 17.4485, "lng": 78.3908}
    },
    {
        "id": "S02",
        "name": "Shelter S02 (Government School)",
        "totalCapacity": 600,
        "currentOccupancy": 150,
        "availableCapacity": 450,
        "location": {"lat": 17.4350, "lng": 78.4980}
    },
    {
        "id": "S03",
        "name": "Shelter S03 (Red Cross Center)",
        "totalCapacity": 220,
        "currentOccupancy": 120,
        "availableCapacity": 100,
        "location": {"lat": 17.3750, "lng": 78.4350}
    },
    {
        "id": "S04",
        "name": "Shelter S04 (Sports Arena)",
        "totalCapacity": 800,
        "currentOccupancy": 150,
        "availableCapacity": 650,
        "location": {"lat": 17.3380, "lng": 78.4890}
    }
]

ROADS = [
    {"source": "A", "destination": "J_Banjara", "cost": 4.2, "status": "open"},
    {"source": "A", "destination": "J_Hitec", "cost": 5.1, "status": "open"},
    {"source": "B", "destination": "J_Charminar", "cost": 3.8, "status": "open"},
    {"source": "B", "destination": "J_Mehdipatnam", "cost": 4.5, "status": "open"},
    {"source": "C", "destination": "J_Banjara", "cost": 3.2, "status": "open"},
    {"source": "C", "destination": "J_Central", "cost": 4.8, "status": "blocked"},
    {"source": "D", "destination": "J_Banjara", "cost": 3.5, "status": "open"},
    {"source": "D", "destination": "J_Central", "cost": 4.0, "status": "open"},
    {"source": "E", "destination": "J_Charminar", "cost": 4.1, "status": "open"},
    {"source": "E", "destination": "J_Mehdipatnam", "cost": 3.6, "status": "open"},
    {"source": "J_Banjara", "destination": "J_Central", "cost": 3.6, "status": "open"},
    {"source": "J_Hitec", "destination": "J_Central", "cost": 6.8, "status": "open"},
    {"source": "J_Central", "destination": "J_Secunderabad", "cost": 4.5, "status": "open"},
    {"source": "J_Central", "destination": "J_Charminar", "cost": 5.2, "status": "open"},
    {"source": "J_Mehdipatnam", "destination": "J_Charminar", "cost": 4.0, "status": "blocked"},
    {"source": "J_Central", "destination": "S01", "cost": 2.0, "status": "open"},
    {"source": "J_Central", "destination": "S02", "cost": 3.8, "status": "open"},
    {"source": "J_Secunderabad", "destination": "S02", "cost": 2.5, "status": "open"},
    {"source": "J_Charminar", "destination": "S03", "cost": 2.1, "status": "open"},
    {"source": "J_Charminar", "destination": "S04", "cost": 2.6, "status": "open"}
]

# ==========================================
# 2. DAA ALGORITHMS IN PYTHON
# ==========================================

def calculate_priority_score(zone, max_pop=100.0):
    threat = float(zone.get("threatSeverity", 80))
    pop = float(zone.get("remaining", zone.get("population", 100)))
    urgency = float(zone.get("timeUrgency", 75))
    vuln = float(zone.get("vulnerability", 70))

    pop_factor = min(100.0, max(0.0, (pop / max(1.0, float(max_pop))) * 100.0))
    score = round((0.40 * threat) + (0.25 * pop_factor) + (0.20 * urgency) + (0.15 * vuln), 1)

    return {
        "priority_score": score,
        "threat": threat,
        "population_factor": round(pop_factor, 1),
        "urgency": urgency,
        "vulnerability": vuln
    }

def build_graph(roads):
    graph = {}
    for r in roads:
        if r.get("blocked", False) or r.get("status") == "blocked":
            continue
        u, v, c = r["source"], r["destination"], float(r.get("cost", 1.0))
        graph.setdefault(u, []).append((v, c))
        graph.setdefault(v, []).append((u, c))
    return graph

def run_bfs(graph, start_node, shelter_ids):
    visited = {start_node}
    queue = deque([start_node])
    hop_counts = {start_node: 0}
    levels = {0: [start_node]}
    visit_order = [start_node]

    while queue:
        curr = queue.popleft()
        curr_hops = hop_counts[curr]

        for nbr, _ in graph.get(curr, []):
            if nbr not in visited:
                visited.add(nbr)
                visit_order.append(nbr)
                hops = curr_hops + 1
                hop_counts[nbr] = hops
                levels.setdefault(hops, []).append(nbr)
                queue.append(nbr)

    reachable_shelters = []
    min_hop_shelter = None
    min_hops = float("inf")

    for s_id in shelter_ids:
        if s_id in visited:
            h = hop_counts[s_id]
            reachable_shelters.append({"id": s_id, "hops": h})
            if h < min_hops:
                min_hops = h
                min_hop_shelter = s_id

    return {
        "reachable_shelters": reachable_shelters,
        "minimum_hop_shelter": min_hop_shelter,
        "minimum_hops": min_hops if min_hops != float("inf") else None,
        "levels": levels,
        "visit_order": visit_order,
        "hop_counts": hop_counts
    }

def run_dijkstra(graph, start_node, target_node):
    dist = {start_node: 0.0}
    prev = {start_node: None}
    pq = [(0.0, start_node)]
    visited_order = []

    while pq:
        d, u = heapq.heappop(pq)
        if u in visited_order:
            continue
        visited_order.append(u)

        if u == target_node:
            break

        for v, weight in graph.get(u, []):
            new_dist = d + weight
            if new_dist < dist.get(v, float("inf")):
                dist[v] = new_dist
                prev[v] = u
                heapq.heappush(pq, (new_dist, v))

    path = []
    curr = target_node
    while curr is not None:
        path.append(curr)
        if curr == start_node:
            break
        curr = prev.get(curr)

    if not path or path[-1] != start_node:
        path = []
    else:
        path.reverse()

    return {
        "path": path,
        "total_cost": round(dist.get(target_node, 0.0), 2) if target_node in dist else None,
        "visited_order": visited_order,
        "dist": {k: round(v, 2) for k, v in dist.items()}
    }

# ==========================================
# 3. REST API ENDPOINTS
# ==========================================

@app.route("/calculate-priority", methods=["POST"])
def api_calculate_priority():
    body = request.get_json(silent=True) or {}
    zones = body.get("zones", ZONES)
    max_pop = max((z.get("population", 0) for z in zones), default=100)
    results = [calculate_priority_score(z, max_pop) for z in zones]
    return jsonify({"success": True, "data": results})

@app.route("/priority-queue", methods=["POST"])
def api_priority_queue():
    body = request.get_json(silent=True) or {}
    zones = body.get("zones", ZONES)
    max_pop = max((z.get("population", 0) for z in zones), default=100)
    
    pq = []
    for z in zones:
        s = calculate_priority_score(z, max_pop)
        key = (-s["priority_score"], -z.get("threatSeverity", 0), z["id"])
        heapq.heappush(pq, (key, {**z, **s}))
    
    ordered = [heapq.heappop(pq)[1] for _ in range(len(pq))]
    return jsonify({"success": True, "extraction_order": ordered, "highest": ordered[0] if ordered else None})

@app.route("/bfs", methods=["POST"])
def api_bfs():
    body = request.get_json(silent=True) or {}
    start_zone = body.get("start_zone", "A")
    roads = body.get("roads", ROADS)
    graph = build_graph(roads)
    shelter_ids = [s["id"] for s in SHELTERS]
    return jsonify({"success": True, "bfs": run_bfs(graph, start_zone, shelter_ids)})

@app.route("/dijkstra", methods=["POST"])
def api_dijkstra():
    body = request.get_json(silent=True) or {}
    start_node = body.get("start_node", "A")
    target_node = body.get("target_node", "S02")
    roads = body.get("roads", ROADS)
    graph = build_graph(roads)
    return jsonify({"success": True, "dijkstra": run_dijkstra(graph, start_node, target_node)})

@app.route("/evacuation-plan", methods=["POST"])
def api_evacuation_plan():
    body = request.get_json(silent=True) or {}
    zone_id = body.get("zone_id", "A")
    zone = next((z for z in ZONES if z["id"] == zone_id), ZONES[0])
    roads = body.get("roads", ROADS)
    graph = build_graph(roads)

    max_pop = max((z.get("population", 0) for z in ZONES), default=100)
    priority = calculate_priority_score(zone, max_pop)

    shelter_ids = [s["id"] for s in SHELTERS]
    bfs = run_bfs(graph, zone_id, shelter_ids)

    shelters_audit = {}
    feasible_shelters = []
    required_pop = zone.get("remaining", zone.get("population", 0))

    for s in SHELTERS:
        avail = max(0, s["totalCapacity"] - s["currentOccupancy"])
        is_reachable = any(rs["id"] == s["id"] for rs in bfs["reachable_shelters"])
        is_feasible = is_reachable and avail >= required_pop
        
        reason = "Feasible" if is_feasible else (
            "Unreachable via BFS" if not is_reachable else f"Insufficient capacity: Required {required_pop} > Available {avail}"
        )
        
        shelters_audit[s["id"]] = {
            "name": s["name"],
            "available_capacity": avail,
            "feasible": is_feasible,
            "reason": reason
        }
        if is_feasible:
            feasible_shelters.append(s)

    best_route = None
    min_cost = float("inf")

    candidates = feasible_shelters if feasible_shelters else [s for s in SHELTERS if any(rs["id"] == s["id"] for rs in bfs["reachable_shelters"])]
    for s in candidates:
        r = run_dijkstra(graph, zone_id, s["id"])
        if r["total_cost"] is not None and r["total_cost"] < min_cost:
            min_cost = r["total_cost"]
            best_route = {
                "shelter": s,
                "cost": r["total_cost"],
                "path": r["path"],
                "dijkstra": r
            }

    why_zone = f"{zone['name']} was prioritized with Priority Score {priority['priority_score']}/100 based on Threat {priority['threat']}, Pop Factor {priority['population_factor']}, Urgency {priority['urgency']}, and Vulnerability {priority['vulnerability']}."
    why_shelter = f"Shelter {best_route['shelter']['id']} was selected because it is verified reachable via BFS, has available capacity ({best_route['shelter']['totalCapacity'] - best_route['shelter']['currentOccupancy']} >= {required_pop}), and offers the minimum Dijkstra travel cost ({best_route['cost']} km)." if best_route else "No feasible shelter found."

    return jsonify({
        "success": True,
        "selected_zone": zone_id,
        "priority_score": priority["priority_score"],
        "priority_breakdown": priority,
        "bfs": bfs,
        "shelters": shelters_audit,
        "feasible_shelters": [s["id"] for s in feasible_shelters],
        "dijkstra": best_route["dijkstra"] if best_route else None,
        "explanation": {
            "why_zone_prioritized": why_zone,
            "why_shelter_selected": why_shelter
        }
    })

# ==========================================
# 4. STATIC WEB SERVER
# ==========================================

@app.route("/")
def index():
    return send_from_directory(".", "index.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(".", path)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    print(f"\n=======================================================")
    print(f"  Disaster Evacuation Planner - Flask + Python Server")
    print(f"  Running on: http://127.0.0.1:{port}/")
    print(f"=======================================================\n")
    app.run(host="0.0.0.0", port=port, debug=False)
