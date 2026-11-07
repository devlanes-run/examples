import { createServer } from "node:http";

const port = Number(process.env.PORT);
const host = process.env.HOST ?? "127.0.0.1";

// This lane's https origins only, so a page from another lane or site gets no
// CORS headers. test/lane.test.mjs checks both cases.
const allowedOrigins = new Set((process.env.DEVLANES_ORIGINS ?? "").split(",").filter(Boolean));

const items = [
  { id: 1, sku: "ACME-001", name: "Anvil", price_cents: 4999 },
  { id: 2, sku: "ACME-002", name: "Rocket skates", price_cents: 12900 },
  { id: 3, sku: "ACME-003", name: "Giant magnet", price_cents: 2450 },
];

function laneInfo(req) {
  // Only requests that came through the devlanes proxy carry X-Forwarded-Host.
  const forwardedHost = req.headers["x-forwarded-host"];
  return {
    project: process.env.DEVLANES_LANE_PROJECT,
    lane: Number(process.env.DEVLANES_LANE),
    lane_name: process.env.DEVLANES_LANE_NAME,
    branch: process.env.LANE_LABEL,
    service: process.env.DEVLANES_SERVICE,
    port,
    url: forwardedHost ? `https://${forwardedHost}` : null,
  };
}

function send(res, status, body) {
  const text = typeof body === "string" ? body : JSON.stringify(body, null, 2) + "\n";
  const type = typeof body === "string" ? "text/plain" : "application/json";
  res.writeHead(status, { "content-type": `${type}; charset=utf-8` });
  res.end(text);
}

const server = createServer((req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  const origin = req.headers.origin;

  res.setHeader("vary", "Origin");
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("access-control-allow-origin", origin);
  }

  switch (`${req.method} ${pathname}`) {
    case "GET /healthz":
      return send(res, 200, "ok");
    case "GET /lane":
      return send(res, 200, laneInfo(req));
    case "GET /":
      return send(res, 200, {
        ...laneInfo(req),
        // npm sets npm_lifecycle_event to the script it runs: dev, or start
        // under the e2e profile's run_scripts.
        script: process.env.npm_lifecycle_event ?? null,
        node_env: process.env.NODE_ENV ?? null,
        items,
      });
    case "GET /api/items":
      return send(res, 200, { lane: Number(process.env.DEVLANES_LANE), items });
    default:
      return send(res, 404, { error: `no route for ${req.method} ${pathname}` });
  }
});

server.listen(port, host, () => {
  console.log(`api listening on http://${host}:${port}`);
});
