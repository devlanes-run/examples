import { readFileSync } from "node:fs";

const env = process.env;

// Outside devlanes (the mprocs setup in before/) the DEVLANES_* variables are
// unset, so these fields come out as null.
export function laneInfo(req, port) {
  // Only requests that came through a proxy carry X-Forwarded-Host.
  const forwarded = req.headers["x-forwarded-host"];
  return {
    project: env.DEVLANES_LANE_PROJECT ?? null,
    lane: env.DEVLANES_LANE === undefined ? null : Number(env.DEVLANES_LANE),
    lane_name: env.DEVLANES_LANE_NAME ?? null,
    branch: env.LANE_LABEL ?? null,
    service: env.DEVLANES_SERVICE ?? null,
    port,
    url: forwarded ? `https://${forwarded}` : null,
  };
}

export function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body, null, 2) + "\n");
}

export function sendText(res, status, text) {
  res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  res.end(text);
}

export async function readJson(req) {
  let text = "";
  for await (const chunk of req) text += chunk;
  try {
    return JSON.parse(text || "{}");
  } catch {
    return null;
  }
}

const assets = {
  "/devlanes.css": "text/css; charset=utf-8",
  "/logo.svg": "image/svg+xml",
};

export function serveAsset(res, path) {
  if (!assets[path]) return false;
  // Read on every request: node --watch restarts only for imported modules.
  res.writeHead(200, { "content-type": assets[path] });
  res.end(readFileSync(new URL(`.${path}`, import.meta.url)));
  return true;
}

export const escape = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
