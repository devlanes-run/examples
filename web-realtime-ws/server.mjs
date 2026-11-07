import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { WebSocketServer, WebSocket } from 'ws';
import { renderPage } from './page.mjs';

const env = process.env;
const HOST = env.HOST ?? '127.0.0.1';
const ports = { default: Number(env.PORT), ws: Number(env.WS_PORT), admin: Number(env.ADMIN_PORT) };
const laneDomain = env.LANE_DOMAIN;
const lane = {
  project: env.DEVLANES_LANE_PROJECT,
  lane: Number(env.DEVLANES_LANE),
  lane_name: env.DEVLANES_LANE_NAME,
  branch: env.LANE_LABEL,
  service: env.DEVLANES_SERVICE,
  port: ports.default,
};
// WebSockets are not covered by CORS, so the server checks Origin itself.
const origins = new Set((env.DEVLANES_ORIGINS ?? '').split(',').filter(Boolean));
const startedAt = Date.now();

const files = {
  '/app.js': ['text/javascript', readFileSync(new URL('./public/app.js', import.meta.url))],
  '/devlanes.css': ['text/css', readFileSync(new URL('./public/devlanes.css', import.meta.url))],
  '/logo.svg': ['image/svg+xml', readFileSync(new URL('./public/logo.svg', import.meta.url))],
};

function lanePayload(req) {
  const forwarded = req.headers['x-forwarded-host'];
  return { ...lane, url: forwarded ? `https://${forwarded}` : null };
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body, null, 2) + '\n');
}

// /healthz and /lane answer on every port, so each hostname can be checked on its own.
function common(req, res) {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('ok');
    return true;
  }
  if (req.url === '/lane') {
    sendJson(res, 200, lanePayload(req));
    return true;
  }
  return false;
}

// Server-Sent Events: one tick per second to every open /events stream.
const sseClients = new Set();
let tick = 0;
setInterval(() => {
  tick += 1;
  const data = JSON.stringify({ lane: lane.lane, tick, time: new Date().toISOString() });
  for (const res of sseClients) res.write(`data: ${data}\n\n`);
}, 1000);

function events(req, res) {
  res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
  res.write(`data: ${JSON.stringify({ lane: lane.lane, tick, time: new Date().toISOString() })}\n\n`);
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
}

// One chat room per WebSocket server: the page joins both and shows where each echo came from.
const recent = [];
let messageCount = 0;

function chatRoom(portName) {
  const wss = new WebSocketServer({
    noServer: true,
    verifyClient: ({ origin }) => !origin || origins.has(origin),
  });
  wss.on('connection', (socket, req) => {
    const tag = {
      lane: lane.lane,
      lane_name: lane.lane_name,
      via: req.headers['x-forwarded-host'] ?? req.headers.host,
      port_name: portName,
      port: ports[portName],
    };
    socket.send(JSON.stringify({ type: 'hello', ...tag }));
    socket.on('message', (data) => {
      let id = null;
      let text = String(data);
      try {
        ({ id = null, text = '' } = JSON.parse(text));
      } catch {}
      const message = { type: 'chat', ...tag, id, text: String(text).slice(0, 500), at: new Date().toISOString() };
      messageCount += 1;
      recent.push(message);
      if (recent.length > 20) recent.shift();
      const out = JSON.stringify(message);
      for (const client of wss.clients) if (client.readyState === WebSocket.OPEN) client.send(out);
    });
  });
  return wss;
}

const mainChat = chatRoom('default');
const portChat = chatRoom('ws');

function upgradeWith(wss) {
  return (req, socket, head) => wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
}

const wsServer = createServer((req, res) => {
  if (common(req, res)) return;
  res.writeHead(426, { 'content-type': 'text/plain' });
  res.end(`WebSocket endpoint of lane ${lane.lane}: connect with wss://ws.${laneDomain}\n`);
});
// Any path on the ws port is the chat.
wsServer.on('upgrade', upgradeWith(portChat));

const adminServer = createServer((req, res) => {
  if (common(req, res)) return;
  if (req.url !== '/') return sendJson(res, 404, { error: 'not found' });
  sendJson(res, 200, {
    ...lanePayload(req),
    ports,
    hosts: { default: laneDomain, ws: `ws.${laneDomain}`, admin: `admin.${laneDomain}` },
    uptime_s: Math.round((Date.now() - startedAt) / 1000),
    connections: { sse: sseClients.size, ws_port: portChat.clients.size, main_port_ws: mainChat.clients.size },
    sse_ticks: tick,
    messages: messageCount,
    recent,
  });
});

const mainServer = createServer((req, res) => {
  if (common(req, res)) return;
  const path = req.url.split('?')[0];
  if (path === '/events') return events(req, res);
  if (path === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(renderPage({ ...lanePayload(req), domain: laneDomain, ports }));
  }
  const file = files[path];
  if (file) {
    res.writeHead(200, { 'content-type': file[0] });
    return res.end(file[1]);
  }
  sendJson(res, 404, { error: 'not found' });
});
// The main port takes upgrades too, on /ws, through the same hostname as the page.
const mainUpgrade = upgradeWith(mainChat);
mainServer.on('upgrade', (req, socket, head) => {
  if (req.url.split('?')[0] === '/ws') return mainUpgrade(req, socket, head);
  socket.end('HTTP/1.1 404 Not Found\r\n\r\n');
});

function listen(server, port) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, HOST, resolve);
  });
}

// The main port opens last: once its /healthz answers, the ws and admin ports listen too.
await listen(wsServer, ports.ws);
await listen(adminServer, ports.admin);
await listen(mainServer, ports.default);
console.log(`lane ${lane.lane}: page on ${ports.default}, ws on ${ports.ws}, admin on ${ports.admin}`);
