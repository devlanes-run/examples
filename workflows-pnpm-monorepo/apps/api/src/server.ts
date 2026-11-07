// Node runs this file as is (type stripping), so only erasable TypeScript here.
import { createServer } from "node:http";
import type { ServerResponse } from "node:http";
import { laneJson, serverEnv } from "@acme/config";

const env = serverEnv(process.env);
// DEVLANES_ORIGINS lists this lane's https origins (web, admin, api), so only
// this lane's pages get CORS headers.
const allowedOrigins = new Set(env.origins);

const accounts = [
  { id: 1, name: "Acme Rockets", plan: "enterprise", seats: 120 },
  { id: 2, name: "Acme Anvils", plan: "team", seats: 14 },
  { id: 3, name: "Acme Magnets", plan: "starter", seats: 3 },
];

function send(res: ServerResponse, status: number, body: unknown) {
  const isText = typeof body === "string";
  res.writeHead(status, { "content-type": `${isText ? "text/plain" : "application/json"}; charset=utf-8` });
  res.end(isText ? body : JSON.stringify(body, null, 2));
}

const server = createServer((req, res) => {
  const { pathname } = new URL(req.url ?? "/", "http://localhost");
  const origin = req.headers.origin;
  res.setHeader("vary", "Origin");
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("access-control-allow-origin", origin);
  }

  const forwardedHost = req.headers["x-forwarded-host"];
  const lane = laneJson(env, Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost, req.headers.host);

  switch (`${req.method} ${pathname}`) {
    case "GET /healthz":
      return send(res, 200, "ok");
    case "GET /lane":
      return send(res, 200, lane);
    case "GET /":
      return send(res, 200, { ...lane, accounts });
    case "GET /api/accounts":
      return send(res, 200, { lane: env.lane, accounts });
    default:
      return send(res, 404, { error: `no route for ${req.method} ${pathname}` });
  }
});

server.listen(env.port, env.host, () => {
  console.log(`api listening on http://${env.host}:${env.port}`);
});
