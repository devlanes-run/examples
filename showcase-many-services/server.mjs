import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const env = process.env;
const kind = env.KIND;
const service = env.DEVLANES_SERVICE;
const port = Number(env.PORT);
const host = env.HOST ?? "127.0.0.1";
const repo = "https://github.com/devlanes-run/examples/tree/main/showcase-many-services";

// "1000-6000" -> a random whole number in that range.
function pick(range) {
  const [min, max = min] = String(range ?? "0").split("-").map(Number);
  return Math.round(min + Math.random() * (max - min));
}

function busy(ms) {
  const end = performance.now() + ms;
  let x = 0;
  while (performance.now() < end) x += Math.sqrt(Math.random());
  return x;
}

const started = performance.now();
const bootMs = pick(env.BOOT_MS);
let readyAfterMs = null;
let bursts = 0;

function laneInfo(req) {
  // Only requests that came through the devlanes proxy carry X-Forwarded-Host.
  const forwarded = req?.headers["x-forwarded-host"];
  return {
    project: env.DEVLANES_LANE_PROJECT,
    lane: Number(env.DEVLANES_LANE),
    lane_name: env.DEVLANES_LANE_NAME,
    branch: env.LANE_LABEL,
    service,
    port,
    url: forwarded ? `https://${forwarded}` : null,
  };
}

function stats() {
  const cpu = process.cpuUsage();
  return {
    service,
    kind,
    ready_after_ms: readyAfterMs,
    bursts,
    cpu_ms: Math.round((cpu.user + cpu.system) / 1000),
    uptime_s: Math.round(process.uptime()),
  };
}

const escape = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function send(res, status, type, body) {
  res.writeHead(status, { "content-type": type });
  res.end(body);
}

const json = (res, data) => send(res, 200, "application/json", JSON.stringify(data, null, 2) + "\n");
const html = (res, body) => send(res, 200, "text/html; charset=utf-8", body);

const assets = {
  "/devlanes.css": "text/css; charset=utf-8",
  "/logo.svg": "image/svg+xml",
};

const orders = [
  { id: 1, customer: "Ada Acme", total: "49.00 EUR" },
  { id: 2, customer: "Grace Acme", total: "12.50 EUR" },
  { id: 3, customer: "Linus Acme", total: "7.90 EUR" },
];

function page(info, body, refresh) {
  const url = info.url
    ? `<a href="${escape(info.url)}">${escape(info.url)}</a>`
    : `<span class="dl-bad">not through the proxy</span>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${refresh ? `<meta http-equiv="refresh" content="${refresh}">\n` : ""}<title>${escape(info.service)}, lane ${escape(info.lane)} of ${escape(info.project)}</title>
<link rel="icon" href="/logo.svg">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap">
<link rel="stylesheet" href="/devlanes.css">
<style>
  .wide { max-width: 880px; }
  .units { width: 100%; border-collapse: collapse; margin: 0; }
  .units th, .units td { padding: 2px 22px 2px 0; text-align: left; white-space: nowrap; }
  .units th { color: var(--dl-term-dim); font-weight: 400; }
  .units td { color: var(--dl-term-out); }
  .units .num { text-align: right; }
  .table { padding: 16px 22px; overflow-x: auto; }
  .api { color: #7fd3d8; } .web { color: var(--dl-ok); } .worker { color: #d7a1d8; } .job { color: var(--dl-url); }
</style>
</head>
<body style="--dl-lane: var(--dl-lane-${info.lane % 4})">
<div class="dl-page">
  <header class="dl-header">
    <a class="dl-brand" href="https://devlanes.run"><img src="/logo.svg" alt="" width="32" height="32">devlanes</a>
    <nav class="dl-nav"><a href="${repo}">showcase-many-services on GitHub</a></nav>
  </header>
  <main class="dl-main">
    <h1 class="dl-title">This is lane ${escape(info.lane)} of ${escape(info.project)}.</h1>
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
${body}
  </main>
  <footer class="dl-footer">server.mjs as ${escape(kind)}, node:http, no dependencies</footer>
</div>
</body>
</html>
`;
}

function statsCard(s) {
  return `
    <div class="dl-card">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>/stats</span><span></span></div>
      <dl class="dl-rows">
        <dt>kind</dt><dd class="${escape(s.kind)}">${escape(s.kind)}</dd>
        <dt>ready after</dt><dd class="dl-ok">${(s.ready_after_ms / 1000).toFixed(1)} s</dd>
        <dt>cpu bursts</dt><dd>${s.bursts}</dd>
        <dt>cpu time</dt><dd>${s.cpu_ms} ms</dd>
        <dt>uptime</dt><dd>${s.uptime_s} s</dd>
      </dl>
    </div>`;
}

async function probe(name) {
  const key = name.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  const url = env[`URL_${key}`];
  const link = env[`PUBLIC_URL_${key}`] ?? url;
  try {
    const answer = await fetch(`${url}/stats`, { signal: AbortSignal.timeout(1000) });
    return { name, link, ...(await answer.json()) };
  } catch (error) {
    return { name, link, error: error.cause?.code ?? error.name };
  }
}

async function index(req, res) {
  const names = (env.SERVICES ?? "").split(",").filter(Boolean);
  const rows = await Promise.all(names.map(probe));
  const up = rows.filter((r) => !r.error).length;
  const lines = rows.map((r) => {
    const state = r.error
      ? `<td class="dl-bad">no answer (${escape(r.error)})</td>`
      : `<td class="dl-ok">ready after ${(r.ready_after_ms / 1000).toFixed(1)} s</td>`;
    const kindCell = r.kind ? `<td class="${escape(r.kind)}">${escape(r.kind)}</td>` : "<td></td>";
    return `          <tr><td><a href="${escape(r.link)}">${escape(r.name)}</a></td>${kindCell}${state}<td class="num">${r.bursts ?? ""}</td><td class="num">${r.cpu_ms ?? ""}</td></tr>`;
  });
  const body = `
    <h2 class="dl-h2">${up} of ${rows.length} services answer</h2>
    <p class="dl-lede">This page asks every service of the lane for <code>/stats</code> and reloads every 2 seconds. Each name links to the service: its hostname when it has one, else its <code>127.0.0.1</code> port.</p>
    <div class="dl-card wide">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>services</span><span></span></div>
      <div class="table">
        <table class="units">
          <tr><th>service</th><th>kind</th><th>state</th><th class="num">bursts</th><th class="num">cpu ms</th></tr>
${lines.join("\n")}
        </table>
      </div>
    </div>`;
  html(res, page(laneInfo(req), body, 2));
}

function handle(req, res) {
  const path = new URL(req.url, "http://localhost").pathname;
  if (path === "/healthz") return send(res, 200, "text/plain; charset=utf-8", "ok");
  if (path === "/lane") return json(res, laneInfo(req));
  if (path === "/stats") return json(res, stats());
  if (assets[path]) return send(res, 200, assets[path], readFileSync(new URL(`.${path}`, import.meta.url)));
  if (path === "/api/orders" && kind === "api") return json(res, orders);
  if (path !== "/") return send(res, 404, "text/plain; charset=utf-8", "not found\n");
  if (env.PAGE === "index") return index(req, res);
  if (kind === "web") {
    const link = env.LANE_DOMAIN ? `<p class="dl-lede"><a href="https://${escape(env.LANE_DOMAIN)}">Every service of this lane</a></p>` : "";
    return html(res, page(laneInfo(req), statsCard(stats()) + link));
  }
  const extra = kind === "api" ? { orders } : {};
  json(res, { ...laneInfo(req), ...stats(), ...extra });
}

function burst() {
  const ms = pick(env.BURST_MS);
  busy(ms);
  bursts++;
  if (kind === "worker") console.log(`handled batch ${bursts} in ${ms} ms`);
  if (kind === "job") console.log(`run ${bursts} took ${ms} ms`);
  setTimeout(burst, pick(env.BURST_EVERY_MS));
}

function listen() {
  createServer((req, res) => {
    Promise.resolve(handle(req, res)).catch((error) => {
      console.error(error);
      if (!res.headersSent) send(res, 500, "text/plain; charset=utf-8", `${error.message}\n`);
    });
  }).listen(port, host, () => {
    readyAfterMs = Math.round(performance.now() - started);
    console.log(`${service} ready after ${(readyAfterMs / 1000).toFixed(1)} s on http://${host}:${port}`);
    setTimeout(burst, pick(env.BURST_EVERY_MS));
  });
}

// Boot like a dev server that compiles before it listens: work in short
// slices so the CPU graph shows the start, then listen.
function boot() {
  if (performance.now() - started >= bootMs) return listen();
  busy(40);
  setTimeout(boot, 60);
}

console.log(`${service} (${kind}) starting, listens in ${(bootMs / 1000).toFixed(1)} s`);
boot();
