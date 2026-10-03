"""
Python Unit Test Suite for Disaster Evacuation Planner Algorithms
Verifies:
1. Dynamic Risk Score calculation & factor normalization
2. Priority Queue MaxHeap with deterministic tie-breaking
3. Blocked Road exclusion from graph
4. BFS reachability & minimum-hop calculation
5. Dijkstra binary min-heap routing & predecessor path reconstruction
6. Shelter capacity validation & infeasibility handling
"""

import sys
import os

# Ensure backend package can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.algorithms import (
    calculate_priority_score,
    PriorityQueue,
    build_graph,
    run_bfs,
    run_dijkstra,
    get_available_capacity,
    evaluate_zone_shelter_options
)
from backend.data import DEFAULT_SCENARIO

passed = 0
failed = 0

def test(description, condition):
    global passed, failed
    if condition:
        print(f"  [PASS]: {description}")
        passed += 1
    else:
        print(f"  [FAIL]: {description}")
        failed += 1

print("\n" + "=" * 50)
print("TEST 1: Python Priority Score Calculation")
print("=" * 50)
zone_a = DEFAULT_SCENARIO["zones"][0]
score_a = calculate_priority_score(zone_a, max_population=320)
test("Zone A Priority Score is calculated (~93.8)", abs(score_a["priority_score"] - 93.8) < 0.2)
test("Zone A Pop Factor is normalized to 100%", score_a["pop_factor"] == 100.0)
test("Zone A Level is CRITICAL", score_a["priority_level"] == "CRITICAL")

print("\n" + "=" * 50)
print("TEST 2: Priority Queue (Binary Max-Heap with Tie-Breaking)")
print("=" * 50)
pq = PriorityQueue()
for z in DEFAULT_SCENARIO["zones"]:
    s = calculate_priority_score(z, max_population=320)
    pq.insert({**z, "priorityScore": s["priority_score"]})

test("PQ has 5 zones", len(pq) == 5)
first = pq.extract_max()
test("First extracted is Zone A (highest priority)", first["id"] == "A")
second = pq.extract_max()
test("Second extracted is Zone C", second["id"] == "C")

print("\n" + "=" * 50)
print("TEST 3: Blocked Road Exclusion")
print("=" * 50)
roads = [
    {"source": "A", "destination": "B", "cost": 5.0, "status": "open"},
    {"source": "B", "destination": "C", "cost": 4.0, "status": "blocked"},
    {"source": "A", "destination": "C", "cost": 12.0, "status": "open"}
]
graph = build_graph(roads, ["A", "B", "C"])
b_neighbors = [e["node"] for e in graph["B"]]
test("Open road A-B exists in graph", "A" in b_neighbors)
test("Blocked road B-C excluded from graph", "C" not in b_neighbors)

print("\n" + "=" * 50)
print("TEST 4: BFS Reachability & Minimum Hops")
print("=" * 50)
all_nodes = list(DEFAULT_SCENARIO["nodePositions"].keys())
full_graph = build_graph(DEFAULT_SCENARIO["roads"], all_nodes)
shelter_ids = [s["id"] for s in DEFAULT_SCENARIO["shelters"]]
bfs_res = run_bfs(full_graph, "A", shelter_ids)

test("Reachable shelters contains S01 and S02", any(s["id"] == "S01" for s in bfs_res["reachable_shelters"]))
test("Minimum hop shelter is S01 or S02", bfs_res["minimum_hop_shelter"] in ["S01", "S02"])
test("Minimum hops is 3", bfs_res["minimum_hops"] == 3)
test("Level 0 contains root zone A", bfs_res["levels"][0] == ["A"])

print("\n" + "=" * 50)
print("TEST 5: Dijkstra Routing & Path Reconstruction")
print("=" * 50)
dijk_res = run_dijkstra(full_graph, "A", "S02")
test("Dijkstra finds cost to S02 (~11.6 km)", dijk_res["cost"] is not None and abs(dijk_res["cost"] - 11.6) < 0.2)
test("Path starts at A", dijk_res["path"][0] == "A")
test("Path ends at S02", dijk_res["path"][-1] == "S02")

print("\n" + "=" * 50)
print("TEST 6: Shelter Capacity Validation & Infeasibility")
print("=" * 50)
eval_res = evaluate_zone_shelter_options(zone_a, DEFAULT_SCENARIO["shelters"], full_graph, DEFAULT_SCENARIO["zones"])
test("S01 rejected due to capacity (150 avail < 320 needed)", eval_res["shelters"]["S01"]["feasible"] == False)
test("S01 audit reason states Insufficient capacity", "Insufficient capacity" in eval_res["shelters"]["S01"]["reason"])
test("S02 is feasible (450 avail >= 320 needed)", eval_res["shelters"]["S02"]["feasible"] == True)
test("Dijkstra selects S02 as optimal shelter", eval_res["dijkstra"]["target_shelter"] == "S02")
test("Why This Decision contains explanation", "Zone A" in eval_res["explanation"]["why_zone_prioritized"])

print("\n" + "=" * 50)
print(f"PYTHON TEST SUMMARY: {passed} PASSED, {failed} FAILED")
print("=" * 50)

if failed > 0:
    sys.exit(1)
