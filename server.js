const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const { 
  calculateRiskScore,
  MaxHeap,
  buildGraph,
  runBFS,
  runDijkstra,
  reconstructPath,
  evaluateZoneShelterOptions
} = require('./js/algorithms.js');

const { DEFAULT_SCENARIO, cloneScenario } = require('./js/data.js');

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', err => reject(err));
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data, null, 2));
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  let reqPath = req.url.split('?')[0];

  // API Endpoints
  if (req.method === 'POST') {
    try {
      if (reqPath === '/calculate-priority' || reqPath === '/api/calculate-priority') {
        const body = await parseJsonBody(req);
        const zones = body.zones || (body.zone ? [body.zone] : DEFAULT_SCENARIO.zones);
        const maxPop = body.maxPopulation || Math.max(...zones.map(z => Number(z.population) || 0), 100);

        const results = zones.map(z => calculateRiskScore(z, maxPop));
        return sendJson(res, 200, {
          success: true,
          count: results.length,
          max_population: maxPop,
          data: body.zone ? results[0] : results
        });
      }

      if (reqPath === '/priority-queue' || reqPath === '/api/priority-queue') {
        const body = await parseJsonBody(req);
        const zones = body.zones || DEFAULT_SCENARIO.zones;
        const maxPop = body.maxPopulation || Math.max(...zones.map(z => Number(z.population) || 0), 100);

        const maxHeap = new MaxHeap();
        zones.forEach(z => {
          const evalScore = calculateRiskScore(z, maxPop);
          maxHeap.insert({
            ...z,
            priorityScore: evalScore.riskScore,
            riskScore: evalScore.riskScore,
            breakdown: evalScore.breakdown
          });
        });

        const extractionOrder = [];
        while (!maxHeap.isEmpty()) {
          extractionOrder.push(maxHeap.extractMax());
        }

        return sendJson(res, 200, {
          success: true,
          count: extractionOrder.length,
          highest_priority: extractionOrder[0] || null,
          extraction_order: extractionOrder
        });
      }

      if (reqPath === '/bfs' || reqPath === '/api/bfs') {
        const body = await parseJsonBody(req);
        const roads = body.roads || DEFAULT_SCENARIO.roads;
        const startZone = body.start_zone || body.startNode || 'A';
        const shelterIds = body.shelter_ids || DEFAULT_SCENARIO.shelters.map(s => s.id);
        const allNodes = body.all_nodes || Object.keys(DEFAULT_SCENARIO.nodePositions);

        const graph = buildGraph(roads, allNodes);
        const bfsResult = runBFS(graph, startZone, shelterIds);

        return sendJson(res, 200, {
          success: true,
          start_zone: startZone,
          bfs: {
            reachable_shelters: bfsResult.reachableShelters,
            minimum_hop_shelter: bfsResult.minimumHopShelter,
            minimum_hops: bfsResult.minimumHops,
            levels: bfsResult.levels,
            visit_order: bfsResult.visitedOrder,
            hop_counts: bfsResult.hopCount
          }
        });
      }

      if (reqPath === '/dijkstra' || reqPath === '/api/dijkstra') {
        const body = await parseJsonBody(req);
        const roads = body.roads || DEFAULT_SCENARIO.roads;
        const startNode = body.start_node || body.startZone || 'A';
        const targetNode = body.target_node || body.targetShelter || 'S02';
        const allNodes = body.all_nodes || Object.keys(DEFAULT_SCENARIO.nodePositions);

        const graph = buildGraph(roads, allNodes);
        const dijkstraResult = runDijkstra(graph, startNode, targetNode);

        return sendJson(res, 200, {
          success: true,
          start: startNode,
          target: targetNode,
          dijkstra: {
            route: dijkstraResult.path,
            total_cost: dijkstraResult.cost,
            visited_order: dijkstraResult.visitedOrder,
            tentative_costs: dijkstraResult.dist,
            relaxation_steps: dijkstraResult.relaxationSteps
          }
        });
      }

      if (reqPath === '/evacuation-plan' || reqPath === '/api/evacuation-plan') {
        const body = await parseJsonBody(req);
        const currentScenario = body.scenario || DEFAULT_SCENARIO;
        const zoneId = body.zone_id || body.zoneId || 'A';
        const zone = (currentScenario.zones || []).find(z => z.id === zoneId) || currentScenario.zones[0];
        const shelters = currentScenario.shelters || DEFAULT_SCENARIO.shelters;
        const roads = currentScenario.roads || DEFAULT_SCENARIO.roads;
        const allNodes = Object.keys(currentScenario.nodePositions || DEFAULT_SCENARIO.nodePositions);

        const graph = buildGraph(roads, allNodes);
        const evaluation = evaluateZoneShelterOptions(zone, shelters, graph, currentScenario.zones);

        return sendJson(res, 200, {
          success: true,
          selected_zone: evaluation.selected_zone,
          priority_score: evaluation.priority_score,
          priority_breakdown: evaluation.priority_breakdown,
          bfs: {
            reachable_shelters: evaluation.bfs.reachableShelters,
            minimum_hop_shelter: evaluation.bfs.minimumHopShelter,
            minimum_hops: evaluation.bfs.minimumHops,
            levels: evaluation.bfs.levels,
            visit_order: evaluation.bfs.visitedOrder
          },
          shelters: evaluation.shelters,
          feasible_shelters: evaluation.feasibleShelters.map(s => s.id),
          rejected_shelters: evaluation.rejectedShelters,
          dijkstra: evaluation.dijkstra,
          explanation: evaluation.explanation
        });
      }
    } catch (apiErr) {
      return sendJson(res, 500, {
        success: false,
        error: apiErr.message
      });
    }
  }

  // Static File Serving
  if (reqPath === '/') reqPath = '/index.html';
  
  const filePath = path.join(__dirname, reqPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Disaster Evacuation Planner server running at http://localhost:${PORT}/`);
});
