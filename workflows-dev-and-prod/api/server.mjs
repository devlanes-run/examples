import { createServer } from "node:http";

const port = Number(process.env.PORT);
const host = process.env.HOST ?? "127.0.0.1";
const logLevel = process.env.LOG_LEVEL ?? "info";

// DEVLANES_ORIGINS lists this lane's https origins, so the lane's page may read
// the answers and other lanes' pages may not.
const allowedOrigins = new Set((process.env.DEVLANES_ORIGINS ?? "").split(",").filter(Boolean));

const releases = [
  { version: "2.4.0", channel: "stable", date: "2026-10-28" },
  { version: "2.5.0-rc.1", channel: "candidate", date: "2026-11-03" },
  { version: "2.5.0-dev", channel: "nightly", date: "2026-11-06" },
];

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

// npm sets npm_lifecycle_event to the script it runs, so this shows whether a
// profile's run_scripts swapped dev for start.
function modeInfo() {
  return {
    script: process.env.npm_lifecycle_event,
    // node --watch runs the server in a child process and sets this there.
    watch: process.env.WATCH_REPORT_DEPENDENCIES === "1",
    node_env: process.env.NODE_ENV ?? null,
    profile: process.env.APP_PROFILE ?? null,
    project_file: process.env.PROJECT_FILE,
    log_level: logLevel,
  };
}

function send(res, status, body) {
  const text = typeof body === "string" ? body : JSON.stringify(body, null, 2);
  const type = typeof body === "string" ? "text/plain" : "application/json";
  res.writeHead(status, { "content-type": `${type}; charset=utf-8` });
  res.end(text);
}

const server = createServer((req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  const origin = req.headers.origin;
  if (logLevel === "debug") console.log(`debug: ${req.method} ${pathname}`);

  res.setHeader("vary", "Origin");
  if (origin && allowedOrigins.has(origin)) res.setHeader("access-control-allow-origin", origin);

  switch (`${req.method} ${pathname}`) {
    case "GET /healthz":
      return send(res, 200, "ok");
    case "GET /lane":
      return send(res, 200, laneInfo(req));
    case "GET /mode":
      return send(res, 200, modeInfo());
    case "GET /":
      return send(res, 200, { ...laneInfo(req), mode: modeInfo(), releases });
    case "GET /api/releases":
      return send(res, 200, { releases });
    default:
      return send(res, 404, { error: `no route for ${req.method} ${pathname}` });
  }
});

server.listen(port, host, () => {
  const mode = modeInfo();
  console.log(`api listening on http://${host}:${port}`);
  console.log(`script=${mode.script} NODE_ENV=${mode.node_env} profile=${mode.profile} file=${mode.project_file} LOG_LEVEL=${logLevel}`);
});
