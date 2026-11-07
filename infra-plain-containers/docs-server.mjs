// A server devlanes does not run: start it with
//   devlanes exec --name docs-server -- node docs-server.mjs 4800
// and devlanes.local.yaml routes docs.<lane domain> of every lane to it.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const env = process.env;
// No PORT here: exec units are not services, and the port has to match the
// fixed address in devlanes.local.yaml anyway.
const port = Number(process.argv[2]);
if (!Number.isInteger(port)) {
  console.error("usage: node docs-server.mjs <port>");
  process.exit(2);
}

const assets = {
  "/devlanes.css": ["text/css", readFileSync(new URL("devlanes.css", import.meta.url))],
  "/logo.svg": ["image/svg+xml", readFileSync(new URL("logo.svg", import.meta.url))],
};

function laneInfo(req) {
  const forwarded = req.headers["x-forwarded-host"];
  return {
    project: env.DEVLANES_LANE_PROJECT,
    lane: Number(env.DEVLANES_LANE),
    lane_name: env.DEVLANES_LANE_NAME,
    branch: env.LANE_LABEL ?? null,
    service: "docs-server",
    port,
    url: forwarded ? `https://${forwarded}` : `http://${req.headers.host}`,
  };
}

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function page(info) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(info.project)} docs</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap">
<link rel="stylesheet" href="/devlanes.css">
</head>
<body style="--dl-lane: var(--dl-lane-${info.lane % 4})">
<div class="dl-page">
  <header class="dl-header">
    <a class="dl-brand" href="/"><img src="/logo.svg" alt="">devlanes</a>
    <nav class="dl-nav"><a href="https://github.com/devlanes-run/examples/tree/main/infra-plain-containers">infra-plain-containers on GitHub</a></nav>
  </header>
  <main class="dl-main">
    <h1 class="dl-title">Docs of ${escape(info.project)}, started in lane ${info.lane}.</h1>
    <p class="dl-lede">One <code>node docs-server.mjs</code> process on 127.0.0.1:${port}, declared under <code>infra.external</code> in <code>devlanes.local.yaml</code>. Every lane routes its own docs hostname here; this request came in as <code>${escape(info.url)}</code>.</p>
    <div class="dl-card">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>GET /lane</span><span></span></div>
      <dl class="dl-rows">
        <dt>lane</dt><dd>${info.lane} (${escape(info.lane_name)})</dd>
        <dt>branch</dt><dd>${escape(info.branch ?? "-")}</dd>
        <dt>service</dt><dd>${escape(info.service)}</dd>
        <dt>port</dt><dd>${info.port}</dd>
        <dt>url</dt><dd><a href="${escape(info.url)}">${escape(info.url)}</a></dd>
      </dl>
    </div>
  </main>
  <footer class="dl-footer"><a href="/lane">/lane</a> | <a href="/healthz">/healthz</a></footer>
</div>
</body>
</html>`;
}

function send(res, status, type, body) {
  res.writeHead(status, { "content-type": type });
  res.end(body);
}

createServer((req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  if (req.method !== "GET") return send(res, 405, "text/plain", "method not allowed\n");
  if (assets[pathname]) return send(res, 200, ...assets[pathname]);
  if (pathname === "/healthz") return send(res, 200, "text/plain", "ok\n");
  if (pathname === "/lane")
    return send(res, 200, "application/json", JSON.stringify(laneInfo(req), null, 2));
  if (pathname === "/") return send(res, 200, "text/html; charset=utf-8", page(laneInfo(req)));
  send(res, 404, "text/plain", "not found\n");
}).listen(port, "127.0.0.1", () => {
  console.log(`docs listening on http://127.0.0.1:${port}`);
});
