import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const env = process.env;
const port = Number(env.PORT);
const host = env.HOST ?? "127.0.0.1";
// The browser calls the API, so this is its https hostname.
const apiUrl = env.API_URL;

const assets = {
  "/devlanes.css": "text/css; charset=utf-8",
  "/logo.svg": "image/svg+xml",
};

function laneInfo(req) {
  const forwardedHost = req.headers["x-forwarded-host"];
  return {
    project: env.DEVLANES_LANE_PROJECT,
    lane: Number(env.DEVLANES_LANE),
    lane_name: env.DEVLANES_LANE_NAME,
    branch: env.LANE_LABEL,
    service: env.DEVLANES_SERVICE,
    port,
    url: forwardedHost ? `https://${forwardedHost}` : null,
  };
}

const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const card = (title, content) => `<div class="dl-card">
  <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>${escape(title)}</span><span></span></div>
  ${content}
</div>`;

const rows = (entries) =>
  `<dl class="dl-rows">${entries.map(([k, v]) => `<dt>${escape(k)}</dt><dd>${v}</dd>`).join("")}</dl>`;

function page(info) {
  const url = info.url
    ? `<a href="${escape(info.url)}">${escape(info.url)}</a>`
    : `<span class="dl-bad">not through the proxy</span>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>web, lane ${escape(info.lane)} of ${escape(info.project)}</title>
<link rel="icon" href="/logo.svg">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap">
<link rel="stylesheet" href="/devlanes.css">
</head>
<body style="--dl-lane: var(--dl-lane-${info.lane % 4})">
<div class="dl-page">
  <header class="dl-header">
    <a class="dl-brand" href="https://devlanes.run"><img src="/logo.svg" alt="" width="32" height="32">devlanes</a>
    <nav class="dl-nav"><a href="https://github.com/devlanes-run/examples/tree/main/workflows-ci-with">workflows-ci-with on GitHub</a></nav>
  </header>
  <main class="dl-main">
    <h1 class="dl-title">This is lane ${escape(info.lane)} of ${escape(info.project)}.</h1>
    <p class="dl-lede">The <code>web</code> service of the worktree on <code>${escape(info.branch)}</code>, running <code>npm run ${escape(env.npm_lifecycle_event)}</code>. <code>npm test</code> checks this page's lane and the API's CORS answer for it.</p>
    ${card(`${info.project}@${info.lane}:${info.service}`, rows([
      ["lane", `${escape(info.lane)} <span class="dl-key">${escape(info.lane_name)}</span>`],
      ["branch", escape(info.branch)],
      ["service", escape(info.service)],
      ["port", escape(info.port)],
      ["url", url],
      ["NODE_ENV", escape(env.NODE_ENV ?? "(unset)")],
    ]))}
    ${card(`fetch ${apiUrl}/`, `<pre id="api">loading...</pre>`)}
  </main>
  <footer class="dl-footer">node:http, no dependencies</footer>
</div>
<script>
  // Cross-origin: the browser shows the answer only if the API sends
  // Access-Control-Allow-Origin for this page's origin.
  const out = document.getElementById("api");
  fetch(${JSON.stringify(apiUrl + "/")})
    .then((res) => res.json())
    .then((body) => { out.className = "dl-ok"; out.textContent = JSON.stringify(body, null, 2); })
    .catch((err) => { out.className = "dl-bad"; out.textContent = String(err); });
</script>
</body>
</html>
`;
}

function send(res, status, type, body) {
  res.writeHead(status, { "content-type": type });
  res.end(body);
}

const server = createServer((req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  if (req.method !== "GET") return send(res, 405, "text/plain; charset=utf-8", "method not allowed");
  if (pathname === "/healthz") return send(res, 200, "text/plain; charset=utf-8", "ok");
  if (pathname === "/lane") {
    return send(res, 200, "application/json", JSON.stringify(laneInfo(req), null, 2) + "\n");
  }
  if (pathname === "/") return send(res, 200, "text/html; charset=utf-8", page(laneInfo(req)));
  if (assets[pathname]) {
    return send(res, 200, assets[pathname], readFileSync(new URL(`./public${pathname}`, import.meta.url)));
  }
  send(res, 404, "text/plain; charset=utf-8", "not found");
});

server.listen(port, host, () => {
  console.log(`web listening on http://${host}:${port}, API at ${apiUrl}`);
});
