// Lane values and HTTP helpers shared by api.mjs and web.mjs.
import { readFileSync } from "node:fs";

const env = process.env;

export function laneInfo(req) {
  // Only requests that came through the devlanes proxy carry X-Forwarded-Host.
  const forwarded = req.headers["x-forwarded-host"];
  return {
    project: env.DEVLANES_LANE_PROJECT,
    lane: Number(env.DEVLANES_LANE),
    lane_name: env.DEVLANES_LANE_NAME,
    branch: env.LANE_LABEL,
    service: env.DEVLANES_SERVICE,
    port: Number(env.PORT),
    url: forwarded ? `https://${forwarded}` : null,
  };
}

export function sendJson(res, value) {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify(value, null, 2) + "\n");
}

export function sendText(res, status, text) {
  res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  res.end(text);
}

const assets = {
  "/devlanes.css": "text/css; charset=utf-8",
  "/logo.svg": "image/svg+xml",
};

export function sendAsset(res, path) {
  if (!assets[path]) return false;
  // Read on every request: node --watch restarts only for imported modules, not these files.
  const body = readFileSync(new URL(`.${path}`, import.meta.url));
  res.writeHead(200, { "content-type": assets[path] });
  res.end(body);
  return true;
}

export function listen(server) {
  const port = Number(env.PORT);
  const host = env.HOST ?? "127.0.0.1";
  server.listen(port, host, () => {
    console.log(`${env.DEVLANES_SERVICE} listening on http://${host}:${port}`);
  });
}
