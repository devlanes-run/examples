// HTTP helpers shared by web.mjs and api.mjs.
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

export function sendJson(res, status, value, headers = {}) {
  res.writeHead(status, { "content-type": "application/json", ...headers });
  res.end(JSON.stringify(value, null, 2) + "\n");
}

// Answers /healthz and /lane; returns false for every other path.
export function serveCommon(req, res, path) {
  if (path === "/healthz") {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end("ok");
    return true;
  }
  if (path === "/lane") {
    sendJson(res, 200, laneInfo(req));
    return true;
  }
  return false;
}
