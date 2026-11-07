import { createServer } from "node:http";

const port = Number(process.env.PORT);
const host = process.env.HOST ?? "127.0.0.1";

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

function send(res, status, body) {
  const text = typeof body === "string" ? body : JSON.stringify(body, null, 2);
  const type = typeof body === "string" ? "text/plain" : "application/json";
  res.writeHead(status, { "content-type": `${type}; charset=utf-8` });
  res.end(text);
}

const server = createServer((req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  switch (`${req.method} ${pathname}`) {
    case "GET /healthz":
      return send(res, 200, "ok");
    case "GET /lane":
      return send(res, 200, laneInfo(req));
    case "GET /":
      return send(res, 200, {
        ...laneInfo(req),
        note: "declared only in devlanes.local.yaml",
        api_url: process.env.API_URL ?? null,
      });
    default:
      return send(res, 404, { error: `no route for ${req.method} ${pathname}` });
  }
});

server.listen(port, host, () => {
  console.log(`scratch listening on http://${host}:${port}`);
});
