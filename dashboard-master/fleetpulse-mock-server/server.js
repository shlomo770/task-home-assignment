const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const dispatcherSockets = new Map();
const dispatchers = new Map();
const telemetryHistory = new Map();

const initialFleet = () =>
  Array.from({ length: 12 }, (_, i) => {
    const id = `truck-${i + 1}`;
    return {
      id,
      name: `Truck ${i + 1}`,
      status: i % 4 === 0 ? 'idle' : i % 5 === 0 ? 'maintenance' : 'active',
      lat: 32.08 + i * 0.01,
      lng: 34.78 + i * 0.01,
      speedKmh: 35 + i,
      fuelPercent: 70 - i * 3,
      engineTempC: 78 + (i % 5),
      mileageKm: 12000 + i * 550,
      assignedRouteId: null,
      updatedAt: new Date().toISOString(),
    };
  });

const initialRoutes = () => [
  {
    id: 'route-1',
    truckId: 'truck-1',
    origin: 'Warehouse A',
    destination: 'Downtown',
    status: 'assigned',
    version: '1',
    updatedAt: new Date().toISOString(),
    updatedByDispatcherId: null,
  },
  {
    id: 'route-2',
    truckId: 'truck-2',
    origin: 'Warehouse B',
    destination: 'North Hub',
    status: 'in-progress',
    version: '1',
    updatedAt: new Date().toISOString(),
    updatedByDispatcherId: null,
  },
];

let fleet = initialFleet();
let routes = initialRoutes();

function pushHistory(truck) {
  const arr = telemetryHistory.get(truck.id) || [];
  arr.push({
    timestamp: truck.updatedAt,
    speedKmh: truck.speedKmh,
    fuelPercent: truck.fuelPercent,
    engineTempC: truck.engineTempC,
    mileageKm: truck.mileageKm,
    lat: truck.lat,
    lng: truck.lng,
  });
  if (arr.length > 50) arr.shift();
  telemetryHistory.set(truck.id, arr);
}

fleet.forEach(pushHistory);

function broadcastWs(message) {
  const payload = JSON.stringify(message);
  for (const ws of dispatcherSockets.values()) {
    if (ws.readyState === 1) {
      ws.send(payload);
    }
  }
}

function findTruck(truckId) {
  return fleet.find((t) => t.id === truckId);
}

function findRoute(routeId) {
  return routes.find((r) => r.id === routeId);
}

app.get('/api/fleet', (req, res) => {
  res.json(fleet);
});

app.get('/api/fleet/:truckId', (req, res) => {
  const truck = findTruck(req.params.truckId);
  if (!truck) {
    return res.status(404).json({ message: 'Truck not found' });
  }
  res.json(truck);
});

app.get('/api/routes', (req, res) => {
  res.json(routes);
});

app.post('/api/routes', (req, res) => {
  const dispatcherId = req.header('X-Dispatcher-Id') || null;
  const { truckId, origin, destination } = req.body || {};

  if (!truckId || !origin || !destination) {
    return res.status(400).json({ message: 'truckId, origin, destination are required' });
  }

  const truck = findTruck(truckId);
  if (!truck) {
    return res.status(404).json({ message: 'Truck not found' });
  }

  const route = {
    id: `route-${routes.length + 1}`,
    truckId,
    origin,
    destination,
    status: 'assigned',
    version: '1',
    updatedAt: new Date().toISOString(),
    updatedByDispatcherId: dispatcherId,
  };

  routes.push(route);
  truck.assignedRouteId = route.id;
  truck.updatedAt = new Date().toISOString();

  broadcastWs({
    type: 'route_assigned',
    routeId: route.id,
    truckId: route.truckId,
    updatedByDispatcherId: dispatcherId,
    timestamp: route.updatedAt,
  });

  res.status(201).json(route);
});

app.patch('/api/routes/:routeId', (req, res) => {
  const dispatcherId = req.header('X-Dispatcher-Id') || null;
  const ifMatch = req.header('If-Match');
  const route = findRoute(req.params.routeId);

  if (!route) {
    return res.status(404).json({ message: 'Route not found' });
  }

  if (ifMatch && ifMatch !== route.version) {
    return res.status(409).json({
      message: 'Version conflict',
      currentRoute: route,
    });
  }

  const { status } = req.body || {};
  if (status) route.status = status;

  route.version = String(Number(route.version) + 1);
  route.updatedAt = new Date().toISOString();
  route.updatedByDispatcherId = dispatcherId;

  broadcastWs({
    type: 'route_updated',
    routeId: route.id,
    updatedByDispatcherId: dispatcherId,
    timestamp: route.updatedAt,
  });

  res.json(route);
});

app.put('/api/routes/:routeId/reassign', (req, res) => {
  const dispatcherId = req.header('X-Dispatcher-Id') || null;
  const ifMatch = req.header('If-Match');
  const route = findRoute(req.params.routeId);

  if (!route) {
    return res.status(404).json({ message: 'Route not found' });
  }

  if (ifMatch && ifMatch !== route.version) {
    return res.status(409).json({
      message: 'Version conflict',
      currentRoute: route,
    });
  }

  const { truckId } = req.body || {};
  const nextTruck = findTruck(truckId);

  if (!truckId || !nextTruck) {
    return res.status(400).json({ message: 'Valid truckId is required' });
  }

  const prevTruck = findTruck(route.truckId);
  if (prevTruck && prevTruck.assignedRouteId === route.id) {
    prevTruck.assignedRouteId = null;
    prevTruck.updatedAt = new Date().toISOString();
  }

  route.truckId = truckId;
  route.version = String(Number(route.version) + 1);
  route.updatedAt = new Date().toISOString();
  route.updatedByDispatcherId = dispatcherId;

  nextTruck.assignedRouteId = route.id;
  nextTruck.updatedAt = new Date().toISOString();

  broadcastWs({
    type: 'route_reassigned',
    routeId: route.id,
    truckId,
    updatedByDispatcherId: dispatcherId,
    timestamp: route.updatedAt,
  });

  res.json(route);
});

app.post('/api/fleet/:truckId/alert', (req, res) => {
  const dispatcherId = req.header('X-Dispatcher-Id') || null;
  const truck = findTruck(req.params.truckId);

  if (!truck) {
    return res.status(404).json({ message: 'Truck not found' });
  }

  const { message } = req.body || {};
  const timestamp = new Date().toISOString();

  broadcastWs({
    type: 'truck_alert',
    truckId: truck.id,
    message: message || '',
    updatedByDispatcherId: dispatcherId,
    timestamp,
  });

  res.status(201).json({
    ok: true,
    truckId: truck.id,
    message: message || '',
    timestamp,
  });
});

app.get('/api/telemetry/history/:truckId', (req, res) => {
  const history = telemetryHistory.get(req.params.truckId) || [];
  const limit = Number(req.query.limit || 20);
  res.json(history.slice(-limit));
});

app.post('/api/reset', (req, res) => {
  fleet = initialFleet();
  routes = initialRoutes();
  telemetryHistory.clear();
  fleet.forEach(pushHistory);

  broadcastWs({
    type: 'fleet_reset',
    timestamp: new Date().toISOString(),
  });

  res.json({ ok: true });
});

app.get('/api/telemetry/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const interval = setInterval(() => {
    const truck = fleet[Math.floor(Math.random() * fleet.length)];

    truck.lat += (Math.random() - 0.5) * 0.002;
    truck.lng += (Math.random() - 0.5) * 0.002;
    truck.speedKmh = Math.max(0, Math.round(truck.speedKmh + (Math.random() - 0.5) * 10));
    truck.fuelPercent = Math.max(0, Number((truck.fuelPercent - Math.random() * 0.2).toFixed(1)));
    truck.engineTempC = Math.max(65, Math.min(105, truck.engineTempC + (Math.random() - 0.5) * 2));
    truck.mileageKm = Number((truck.mileageKm + Math.random() * 1.5).toFixed(1));
    truck.updatedAt = new Date().toISOString();

    pushHistory(truck);

    sendEvent({
      type: 'telemetry',
      payload: {
        truckId: truck.id,
        lat: truck.lat,
        lng: truck.lng,
        speedKmh: truck.speedKmh,
        fuelPercent: truck.fuelPercent,
        engineTempC: truck.engineTempC,
        mileageKm: truck.mileageKm,
        timestamp: truck.updatedAt,
      },
    });
  }, 2000);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

wss.on('connection', (ws) => {
  let currentDispatcherId = null;

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'register_dispatcher') {
        currentDispatcherId = `dispatcher-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        dispatchers.set(currentDispatcherId, {
          id: currentDispatcherId,
          name: msg.name,
          isOnline: true,
          viewingTruckId: null,
          lastSeenAt: new Date().toISOString(),
        });

        dispatcherSockets.set(currentDispatcherId, ws);

        ws.send(
          JSON.stringify({
            type: 'registered',
            dispatcherId: currentDispatcherId,
            name: msg.name,
          })
        );

        const snapshot = Array.from(dispatchers.values()).map((dispatcher) => ({
          id: dispatcher.id,
          name: dispatcher.name,
          isOnline: dispatcher.isOnline,
          viewingTruckId: dispatcher.viewingTruckId,
          lastSeenAt: dispatcher.lastSeenAt,
        }));

        ws.send(
          JSON.stringify({
            type: 'dispatchers_snapshot',
            dispatchers: snapshot,
          })
        );

        broadcastWs({
          type: 'dispatcher_joined',
          dispatcherId: currentDispatcherId,
          name: msg.name,
          joinedAt: new Date().toISOString(),
        });

        return;
      }

      if (!currentDispatcherId) return;

      const dispatcher = dispatchers.get(currentDispatcherId);
      if (!dispatcher) return;

      if (msg.type === 'ping') {
        dispatcher.lastSeenAt = new Date().toISOString();
        ws.send(JSON.stringify({ type: 'pong', timestamp: dispatcher.lastSeenAt }));
        return;
      }


      if (msg.type === 'viewing_truck') {
        dispatcher.viewingTruckId = msg.truckId ?? null;
        dispatcher.lastSeenAt = new Date().toISOString();

        broadcastWs({
          type: 'dispatcher_viewing',
          dispatcherId: currentDispatcherId,
          truckId: dispatcher.viewingTruckId,
          timestamp: dispatcher.lastSeenAt,
        });
      }
    } catch (err) {
      console.error('WS message parse error:', err);
    }
  });

  ws.on('close', () => {
    if (!currentDispatcherId) return;

    const dispatcher = dispatchers.get(currentDispatcherId);
    if (dispatcher) {
      dispatcher.isOnline = false;
      dispatcher.lastSeenAt = new Date().toISOString();
    }

    dispatcherSockets.delete(currentDispatcherId);

    broadcastWs({
      type: 'dispatcher_left',
      dispatcherId: currentDispatcherId,
      leftAt: new Date().toISOString(),
    });
  });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
  console.log(`WebSocket listening on ws://localhost:${PORT}/ws`);
});