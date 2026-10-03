"""
Disaster Evacuation Planner - Flask REST API & Web Server
Technology: Python + Flask + CORS
"""

import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from backend.data import DEFAULT_SCENARIO, PRESETS, NODE_POSITIONS
from backend.algorithms import (
    calculate_priority_score,
    PriorityQueue,
    build_graph,
    run_bfs,
    run_dijkstra,
    evaluate_zone_shelter_options
)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
app = Flask(__name__, static_folder=BASE_DIR, static_url_path="")
CORS(app)

# ==========================================
# DAA REST API ENDPOINTS
# ==========================================

@app.route("/calculate-priority", methods=["POST"])
@app.route("/api/calculate-priority", methods=["POST"])
def api_calculate_priority():
    body = request.get_json(silent=True) or {}
    zones = body.get("zones") or ([body["zone"]] if "zone" in body else DEFAULT_SCENARIO["zones"])
    max_pop = body.get("maxPopulation") or max((float(z.get("population", 0)) for z in zones), default=100.0)

    results = [calculate_priority_score(z, max_pop) for z in zones]
    return jsonify({
        "success": True,
        "count": len(results),
        "max_population": max_pop,
        "data": results[0] if "zone" in body else results
    })


@app.route("/priority-queue", methods=["POST"])
@app.route("/api/priority-queue", methods=["POST"])
def api_priority_queue():
    body = request.get_json(silent=True) or {}
    zones = body.get("zones") or DEFAULT_SCENARIO["zones"]
    max_pop = body.get("maxPopulation") or max((float(z.get("population", 0)) for z in zones), default=100.0)

    pq = PriorityQueue()
    for z in zones:
        eval_score = calculate_priority_score(z, max_pop)
        pq.insert({
            **z,
            "priorityScore": eval_score["risk_score"],
            "riskScore": eval_score["risk_score"],
            "breakdown": eval_score["breakdown"]
        })

    extraction_order = []
    while not pq.is_empty():
        extraction_order.append(pq.extract_max())

    return jsonify({
        "success": True,
        "count": len(extraction_order),
        "highest_priority": extraction_order[0] if extraction_order else None,
        "extraction_order": extraction_order
    })


@app.route("/bfs", methods=["POST"])
@app.route("/api/bfs", methods=["POST"])
def api_bfs():
    body = request.get_json(silent=True) or {}
    roads = body.get("roads") or DEFAULT_SCENARIO["roads"]
    start_zone = body.get("start_zone") or body.get("startNode") or "A"
    shelter_ids = body.get("shelter_ids") or [s["id"] for s in DEFAULT_SCENARIO["shelters"]]
    all_nodes = body.get("all_nodes") or list(DEFAULT_SCENARIO["nodePositions"].keys())

    graph = build_graph(roads, all_nodes)
    bfs_result = run_bfs(graph, start_zone, shelter_ids)

    return jsonify({
        "success": True,
        "start_zone": start_zone,
        "bfs": {
            "reachable_shelters": bfs_result["reachable_shelters"],
            "minimum_hop_shelter": bfs_result["minimum_hop_shelter"],
            "minimum_hops": bfs_result["minimum_hops"],
            "levels": bfs_result["levels"],
            "visit_order": bfs_result["visited_order"],
            "hop_counts": bfs_result["hop_counts"]
        }
    })


@app.route("/dijkstra", methods=["POST"])
@app.route("/api/dijkstra", methods=["POST"])
def api_dijkstra():
    body = request.get_json(silent=True) or {}
    roads = body.get("roads") or DEFAULT_SCENARIO["roads"]
    start_node = body.get("start_node") or body.get("startZone") or "A"
    target_node = body.get("target_node") or body.get("targetShelter") or "S02"
    all_nodes = body.get("all_nodes") or list(DEFAULT_SCENARIO["nodePositions"].keys())

    graph = build_graph(roads, all_nodes)
    dijkstra_result = run_dijkstra(graph, start_node, target_node)

    return jsonify({
        "success": True,
        "start": start_node,
        "target": target_node,
        "dijkstra": {
            "route": dijkstra_result["path"],
            "total_cost": dijkstra_result["cost"],
            "visited_order": dijkstra_result["visited_order"],
            "tentative_costs": dijkstra_result["dist"],
            "relaxation_steps": dijkstra_result["relaxation_steps"]
        }
    })


@app.route("/evacuation-plan", methods=["POST"])
@app.route("/api/evacuation-plan", methods=["POST"])
def api_evacuation_plan():
    body = request.get_json(silent=True) or {}
    current_scenario = body.get("scenario") or DEFAULT_SCENARIO
    zone_id = body.get("zone_id") or body.get("zoneId") or "A"

    zones = current_scenario.get("zones", DEFAULT_SCENARIO["zones"])
    zone = next((z for z in zones if z["id"] == zone_id), zones[0])

    shelters = current_scenario.get("shelters", DEFAULT_SCENARIO["shelters"])
    roads = current_scenario.get("roads", DEFAULT_SCENARIO["roads"])
    all_nodes = list(current_scenario.get("nodePositions", DEFAULT_SCENARIO["nodePositions"]).keys())

    graph = build_graph(roads, all_nodes)
    evaluation = evaluate_zone_shelter_options(zone, shelters, graph, zones)

    return jsonify({
        "success": True,
        "selected_zone": evaluation["selected_zone"],
        "priority_score": evaluation["priority_score"],
        "priority_breakdown": evaluation["priority_breakdown"],
        "bfs": evaluation["bfs"],
        "shelters": evaluation["shelters"],
        "feasible_shelters": evaluation["feasible_shelters"],
        "rejected_shelters": evaluation["rejected_shelters"],
        "dijkstra": evaluation["dijkstra"],
        "explanation": evaluation["explanation"]
    })


# ==========================================
# STATIC FILE & FRONTEND ROUTING
# ==========================================

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path and os.path.exists(os.path.join(BASE_DIR, path)):
        return send_from_directory(BASE_DIR, path)
    return send_from_directory(BASE_DIR, "index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀 Disaster Evacuation Planner (Flask + Python) running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
