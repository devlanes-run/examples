import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { checkAll, stores } from "./stores.mjs";

const env = process.env;
const port = Number(env.PORT ?? 3000);
const host = env.HOST ?? "127.0.0.1";
const origins = new Set((env.DEVLANES_ORIGINS ?? "").split(",").filter(Boolean));
const assets = {
  "/devlanes.css": ["text/css", readFileSync(new URL("./devlanes.css", import.meta.url))],
  "/logo.svg": ["image/svg+xml", readFileSync(new URL("./logo.svg", import.meta.url))],
};

function laneInfo(req) {
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

function storeInfo(s, h) {
  return {
    store: s.key,
    container: s.scope,
    kind: s.kind,
    namespace: s.namespace,
    env: s.envVar,
    console: s.console ?? null,
    ok: h.ok,
    health: h.health,
  };
}

function send(res, status, type, body) {
  res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  res.end(body);
}

const json = (res, status, value) =>
  send(res, status, "application/json", `${JSON.stringify(value, null, 2)}\n`);

const esc = (v) => String(v).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function page(info, health) {
  const byKey = Object.fromEntries(health.map((h) => [h.key, h]));
  const cards = stores
    .map((s) => {
      const h = byKey[s.key];
      const reach = s.console
        ? `<dt>console</dt><dd><a href="${esc(s.console)}">${esc(s.console)}</a></dd>`
        : `<dt>shell</dt><dd><code>${esc(s.connect)}</code></dd>`;
      return `<section class="dl-card" style="--dl-lane: var(--dl-lane-${info.lane % 4})">
  <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>${esc(s.title)}</span><span></span></div>
  <dl class="dl-rows">
    <dt>${esc(s.kind)}</dt><dd class="dl-key">${esc(s.namespace)}</dd>
    <dt>container</dt><dd>${esc(s.scope)}</dd>
    <dt>env</dt><dd>${esc(s.envVar)}</dd>
    <dt>health</dt><dd class="${h.ok ? "dl-ok" : "dl-bad"}">${esc(h.health)}</dd>
    ${reach}
  </dl>
  <div class="store-try"><button class="store-button" data-store="${s.key}">Write and read</button><pre data-out="${s.key}"></pre></div>
</section>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lane ${info.lane} of ${esc(info.project)}</title>
<link rel="icon" href="/logo.svg">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap">
<link rel="stylesheet" href="/devlanes.css">
<style>
  .store-try { padding: 0 22px 20px; }
  .store-try pre { padding: 12px 0 0 !important; }
  .store-try pre:empty { display: none; }
  .store-button { padding: 6px 14px; border: 1px solid var(--dl-paint); border-radius: 5px; background: var(--dl-paint); color: var(--dl-ink);
    font: 600 13px var(--dl-sans); cursor: pointer; }
  .store-button:hover { background: transparent; color: var(--dl-paint); }
  .store-button:disabled { opacity: .5; cursor: wait; }
</style>
</head>
<body>
<div class="dl-page">
  <header class="dl-header">
    <a class="dl-brand" href="https://devlanes.run"><img src="/logo.svg" alt="" width="32" height="32">devlanes</a>
    <nav class="dl-nav"><a href="https://github.com/devlanes-run/examples/tree/main/infra-multi-database">infra-multi-database on GitHub</a></nav>
  </header>
  <main class="dl-main">
    <h1 class="dl-title">This is lane ${info.lane} of ${esc(info.project)}.</h1>
    <p class="dl-lede">The <code>${esc(info.service)}</code> service of the <code>${esc(info.branch)}</code> worktree answered. Every card below is one datastore and the part of it that belongs to this lane.</p>
    <section class="dl-card" style="--dl-lane: var(--dl-lane-${info.lane % 4})">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>/lane</span><span></span></div>
      <dl class="dl-rows">
        <dt>lane</dt><dd>${info.lane} (${esc(info.lane_name)})</dd>
        <dt>branch</dt><dd>${esc(info.branch)}</dd>
        <dt>service</dt><dd>${esc(info.service)}</dd>
        <dt>port</dt><dd>${info.port}</dd>
        <dt>url</dt><dd class="dl-url">${esc(info.url ?? "(not through the proxy)")}</dd>
      </dl>
    </section>
    <h2 class="dl-h2">Datastores</h2>
${cards}
  </main>
  <footer class="dl-footer">GET /lane and GET / with Accept: application/json return the same values as JSON.</footer>
</div>
<script>
for (const button of document.querySelectorAll("[data-store]")) {
  button.addEventListener("click", async () => {
    const out = document.querySelector('[data-out="' + button.dataset.store + '"]');
    button.disabled = true;
    try {
      const res = await fetch("/api/stores/" + button.dataset.store + "/try", { method: "POST" });
      const body = await res.json();
      out.className = body.ok ? "dl-ok" : "dl-bad";
      out.textContent = body.ok ? body.lines.join("\\n") : body.error;
    } catch (err) {
      out.className = "dl-bad";
      out.textContent = String(err);
    } finally {
      button.disabled = false;
    }
  });
}
</script>
</body>
</html>
`;
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  try {
    if (req.method === "GET" && pathname === "/healthz")
      return send(res, 200, "text/plain", "ok\n");
    if (req.method === "GET" && pathname === "/lane") return json(res, 200, laneInfo(req));
    if (req.method === "GET" && assets[pathname]) return send(res, 200, ...assets[pathname]);
    if (req.method === "GET" && pathname === "/api/stores") {
      const health = await checkAll();
      return json(
        res,
        200,
        stores.map((s, i) => storeInfo(s, health[i])),
      );
    }
    if (req.method === "GET" && pathname === "/") {
      const info = laneInfo(req);
      const health = await checkAll();
      if ((req.headers.accept ?? "").includes("text/html"))
        return send(res, 200, "text/html; charset=utf-8", page(info, health));
      return json(res, 200, { ...info, stores: stores.map((s, i) => storeInfo(s, health[i])) });
    }
    const tryMatch = pathname.match(/^\/api\/stores\/([a-z0-9]+)\/try$/);
    if (req.method === "POST" && tryMatch) {
      const origin = req.headers.origin;
      if (origin && !origins.has(origin))
        return json(res, 403, { ok: false, error: `origin ${origin} is not in DEVLANES_ORIGINS` });
      const store = stores.find((s) => s.key === tryMatch[1]);
      if (!store) return json(res, 404, { ok: false, error: "no such store" });
      try {
        return json(res, 200, { ok: true, store: store.key, lines: await store.tryIt() });
      } catch (err) {
        return json(res, 200, { ok: false, store: store.key, error: err.message || String(err) });
      }
    }
    send(res, 404, "text/plain", "not found\n");
  } catch (err) {
    console.error(err);
    send(res, 500, "text/plain", `${err.message}\n`);
  }
});

server.listen(port, host, () => console.log(`api listening on http://${host}:${port}`));
