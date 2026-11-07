import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const env = process.env;
const port = Number(env.PORT);
const host = env.HOST ?? "127.0.0.1";

const assets = {
  "/devlanes.css": "text/css; charset=utf-8",
  "/logo.svg": "image/svg+xml",
};

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

const escape = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function page(info) {
  const url = info.url
    ? `<a href="${escape(info.url)}">${escape(info.url)}</a>`
    : `<span class="dl-bad">not through the proxy</span>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lane ${escape(info.lane)} of ${escape(info.project)}</title>
<link rel="icon" href="/logo.svg">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap">
<link rel="stylesheet" href="/devlanes.css">
</head>
<body style="--dl-lane: var(--dl-lane-${info.lane % 4})">
<div class="dl-page">
  <header class="dl-header">
    <a class="dl-brand" href="https://devlanes.run"><img src="/logo.svg" alt="" width="32" height="32">devlanes</a>
    <nav class="dl-nav"><a href="https://github.com/devlanes-run/examples/tree/main/basics-hello-node">basics-hello-node on GitHub</a></nav>
  </header>
  <main class="dl-main">
    <h1 class="dl-title">This is lane ${escape(info.lane)} of <span style="white-space: nowrap">${escape(info.project)}.</span></h1>
    <p class="dl-lede">The <code>${escape(info.service)}</code> service answered from the worktree on <code>${escape(info.branch)}</code>.</p>
    <div class="dl-card">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>${escape(info.project)}@${escape(info.lane)}:${escape(info.service)}</span><span></span></div>
      <dl class="dl-rows">
        <dt>lane</dt><dd>${escape(info.lane)} <span class="dl-key">${escape(info.lane_name)}</span></dd>
        <dt>branch</dt><dd>${escape(info.branch)}</dd>
        <dt>service</dt><dd>${escape(info.service)}</dd>
        <dt>port</dt><dd>${escape(info.port)}</dd>
        <dt>url</dt><dd>${url}</dd>
      </dl>
    </div>
    <h2 class="dl-h2">One server per lane</h2>
    <p class="dl-lede">devlanes gave this process <code>PORT=${escape(info.port)}</code> from the lane's block and routes <code style="white-space: nowrap">${escape(env.LANE_DOMAIN)}</code> to it. Another worktree runs its own copy on its own port and hostname.</p>
    <div class="dl-card">
      <dl class="dl-rows">
        <dt>GET /lane</dt><dd><a href="/lane">the values above as JSON</a></dd>
        <dt>GET /healthz</dt><dd><a href="/healthz">the ready check</a>: <span class="dl-ok">ok</span></dd>
      </dl>
    </div>
  </main>
  <footer class="dl-footer">server.mjs, node:http, no dependencies</footer>
</div>
</body>
</html>
`;
}

const server = createServer((req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;

  if (path === "/healthz") {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    return res.end("ok");
  }
  if (path === "/lane") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(laneInfo(req), null, 2) + "\n");
  }
  if (assets[path]) {
    // Read on every request: node --watch restarts only for imported modules, not these files.
    const body = readFileSync(new URL(`.${path}`, import.meta.url));
    res.writeHead(200, { "content-type": assets[path] });
    return res.end(body);
  }
  if (path === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end(page(laneInfo(req)));
  }
  res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  res.end("not found\n");
});

server.listen(port, host, () => {
  console.log(`hello-node listening on http://${host}:${port}`);
});
