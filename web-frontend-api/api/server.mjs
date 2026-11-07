import { createServer } from "node:http";
import { randomBytes } from "node:crypto";

const port = Number(process.env.PORT);
const host = process.env.HOST ?? "127.0.0.1";
const cookieDomain = process.env.COOKIE_DOMAIN;

// DEVLANES_ORIGINS holds this lane's https origins only, so another lane's page
// gets no CORS headers and the browser keeps the response from it.
const allowedOrigins = new Set((process.env.DEVLANES_ORIGINS ?? "").split(",").filter(Boolean));

const items = [
  { id: 1, sku: "ACME-001", name: "Anvil", price_cents: 4999 },
  { id: 2, sku: "ACME-002", name: "Rocket skates", price_cents: 12900 },
  { id: 3, sku: "ACME-003", name: "Giant magnet", price_cents: 2450 },
];

// In memory on purpose: each lane's API process has its own sessions.
const sessions = new Map();

function laneInfo(req) {
  const forwardedHost = req.headers["x-forwarded-host"];
  return {
    project: process.env.DEVLANES_LANE_PROJECT,
    lane: Number(process.env.DEVLANES_LANE),
    lane_name: process.env.DEVLANES_LANE_NAME,
    branch: process.env.LANE_LABEL,
    service: process.env.DEVLANES_SERVICE,
    port,
    url: forwardedHost ? `https://${forwardedHost}` : `http://${req.headers.host}`,
  };
}

function readCookie(req, name) {
  for (const part of (req.headers.cookie ?? "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return undefined;
}

function send(res, status, body, headers = {}) {
  const text = typeof body === "string" ? body : JSON.stringify(body, null, 2);
  const type = typeof body === "string" ? "text/plain" : "application/json";
  res.writeHead(status, { "content-type": `${type}; charset=utf-8`, ...headers });
  res.end(text);
}

const server = createServer((req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  const origin = req.headers.origin;

  res.setHeader("vary", "Origin");
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("access-control-allow-origin", origin);
    // Lets the browser send and store the session cookie on cross-origin fetches.
    res.setHeader("access-control-allow-credentials", "true");
  }

  if (req.method === "OPTIONS") {
    if (origin && allowedOrigins.has(origin)) {
      res.setHeader("access-control-allow-methods", "GET, POST, DELETE");
      res.setHeader("access-control-allow-headers", "content-type");
    }
    res.writeHead(204);
    return res.end();
  }

  const route = `${req.method} ${pathname}`;
  switch (route) {
    case "GET /healthz":
      return send(res, 200, "ok");
    case "GET /lane":
      return send(res, 200, laneInfo(req));
    case "GET /":
      return send(res, 200, { ...laneInfo(req), items });
    case "GET /api/items":
      return send(res, 200, { lane: Number(process.env.DEVLANES_LANE), items });
    case "POST /api/session": {
      const token = randomBytes(12).toString("hex");
      sessions.set(token, { user: "wile@acme.example.invalid", since: new Date().toISOString() });
      // Domain= makes the cookie reach every name under the lane domain: the page
      // on frontend-api.localhost and this API on api.frontend-api.localhost.
      // HttpOnly is left out only so the page can show document.cookie.
      const cookie = `session=${token}; Domain=${cookieDomain}; Path=/; SameSite=Lax; Secure`;
      return send(res, 201, { signed_in: true, cookie }, { "set-cookie": cookie });
    }
    case "DELETE /api/session": {
      sessions.delete(readCookie(req, "session"));
      const cookie = `session=; Domain=${cookieDomain}; Path=/; SameSite=Lax; Secure; Max-Age=0`;
      return send(res, 200, { signed_in: false }, { "set-cookie": cookie });
    }
    case "GET /api/me": {
      const token = readCookie(req, "session");
      const session = token && sessions.get(token);
      const lane = Number(process.env.DEVLANES_LANE);
      if (!session) return send(res, 200, { signed_in: false, lane, cookie_sent: Boolean(token) });
      return send(res, 200, { signed_in: true, lane, ...session });
    }
    default:
      return send(res, 404, { error: `no route for ${route}` });
  }
});

server.listen(port, host, () => {
  console.log(`api listening on http://${host}:${port}`);
  console.log(`CORS origins: ${[...allowedOrigins].join(", ")}`);
});
