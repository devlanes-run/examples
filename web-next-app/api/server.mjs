import { createServer } from "node:http";

const env = process.env;
const port = Number(env.PORT);
const host = env.HOST ?? "127.0.0.1";
const origins = new Set((env.DEVLANES_ORIGINS ?? "").split(",").filter(Boolean));

const items = [
  { id: "ord_1001", customer: "acme", total: 129.9, status: "paid" },
  { id: "ord_1002", customer: "globex", total: 42.0, status: "pending" },
  { id: "ord_1003", customer: "initech", total: 310.5, status: "shipped" },
];

function laneInfo(req) {
  // Only requests that came through the devlanes proxy carry X-Forwarded-Host.
  const forwarded = req.headers["x-forwarded-host"];
  return {
    project: env.DEVLANES_LANE_PROJECT,
    lane: Number(env.DEVLANES_LANE),
    lane_name: env.DEVLANES_LANE_NAME,
    branch: env.LANE_LABEL,
    service: env.DEVLANES_SERVICE,
    port,
    url: forwarded ? `https://${forwarded}` : null,
  };
}

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body, null, 2) + "\n");
}

const server = createServer((req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;
  const origin = req.headers.origin;
  if (origin && origins.has(origin)) {
    res.setHeader("access-control-allow-origin", origin);
    res.setHeader("vary", "origin");
  }

  if (path === "/healthz") {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    return res.end("ok");
  }
  if (path === "/lane") return json(res, 200, laneInfo(req));
  if (path === "/api/items") return json(res, 200, items);
  if (path === "/") return json(res, 200, { ...laneInfo(req), items });
  json(res, 404, { error: "not found" });
});

server.listen(port, host, () => {
  console.log(`api listening on http://${host}:${port}`);
});
