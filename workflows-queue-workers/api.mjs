import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { connect, keys, prefix } from "./queue.mjs";

const env = process.env;
const port = Number(env.PORT);
const host = env.HOST ?? "127.0.0.1";
const redis = await connect();

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

async function queueState() {
  const [waiting, done, workers] = await Promise.all([
    redis.lLen(keys.waiting),
    redis.lRange(keys.done, 0, 49),
    redis.hGetAll(keys.workers),
  ]);
  return {
    prefix,
    waiting,
    workers: Object.fromEntries(
      Object.entries(workers)
        .sort()
        .map(([name, raw]) => [name, JSON.parse(raw)]),
    ),
    finished: done.map((raw) => JSON.parse(raw)),
  };
}

async function enqueue(count) {
  const ids = [];
  for (let i = 0; i < count; i++) {
    const id = await redis.incr(keys.nextId);
    ids.push(id);
    await redis.lPush(keys.waiting, JSON.stringify({ id, ms: 2000, enqueued_at: Date.now() }));
  }
  return ids;
}

const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function page(info, state) {
  const url = info.url
    ? `<a href="${escape(info.url)}">${escape(info.url)}</a>`
    : `<span class="dl-bad">not through the proxy</span>`;
  // The initial state goes into the page as JSON; the same render function
  // then redraws it from /api/jobs every second.
  const initial = JSON.stringify(state).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lane ${escape(info.lane)} of ${escape(info.project)}</title>
<link rel="icon" href="/logo.svg">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap">
<link rel="stylesheet" href="/devlanes.css">
<style>
  .jobs { width: 100%; border-collapse: collapse; margin: 0; }
  .jobs th, .jobs td { padding: 3px 22px; text-align: left; font-weight: 400; }
  .jobs th { padding-top: 16px; color: var(--dl-term-dim); }
  .jobs tr:last-child td { padding-bottom: 16px; }
  .enqueue { display: flex; gap: 10px; justify-content: center; align-items: center; margin: 0 0 24px; }
  .enqueue input { width: 5em; padding: 7px 10px; border: 1px solid var(--dl-ink); border-radius: 5px; background: transparent; font: 600 14px var(--dl-sans); }
</style>
</head>
<body style="--dl-lane: var(--dl-lane-${info.lane % 4})">
<div class="dl-page">
  <header class="dl-header">
    <a class="dl-brand" href="https://devlanes.run"><img src="/logo.svg" alt="" width="32" height="32">devlanes</a>
    <nav class="dl-nav"><a href="https://github.com/devlanes-run/examples/tree/main/workflows-queue-workers">workflows-queue-workers on GitHub</a></nav>
  </header>
  <main class="dl-main">
    <h1 class="dl-title">This is lane ${escape(info.lane)} of ${escape(info.project)}.</h1>
    <p class="dl-lede">The <code>${escape(info.service)}</code> service answered from the worktree on <code>${escape(info.branch)}</code>. It puts jobs on this lane's queue, and the two <code>worker</code> replicas take them.</p>
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

    <h2 class="dl-h2">This lane's queue</h2>
    <p class="dl-lede">Every key starts with <code>${escape(prefix)}</code>, from <code>queue_prefix</code> in <code>lanes.vars</code>, so workers of other lanes never take these jobs from the shared Redis. Each job takes 2 seconds.</p>
    <form class="enqueue" id="enqueue">
      <input type="number" name="count" min="1" max="100" value="6" aria-label="number of jobs">
      <button class="dl-button">Enqueue jobs</button>
    </form>
    <div class="dl-card">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>queue_prefix: ${escape(prefix)}</span><span></span></div>
      <dl class="dl-rows" id="queue"></dl>
    </div>

    <h2 class="dl-h2">Workers</h2>
    <p class="dl-lede"><code>replicas: 2</code> runs <code>worker.1</code> and <code>worker.2</code>, each with <code>WORKER_ID</code> from <code>\${{ replica.index }}</code>. <code>devlanes stop +worker</code> lets each one finish its job first.</p>
    <div class="dl-card">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>keep_awake: true</span><span></span></div>
      <dl class="dl-rows" id="workers"></dl>
    </div>

    <h2 class="dl-h2">Finished jobs</h2>
    <div class="dl-card">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>${escape(prefix)}:done</span><span></span></div>
      <div id="finished"></div>
    </div>

    <h2 class="dl-h2">Routes</h2>
    <div class="dl-card">
      <dl class="dl-rows">
        <dt>GET /api/jobs</dt><dd><a href="/api/jobs">the queue, workers and finished jobs as JSON</a></dd>
        <dt>POST /api/jobs?count=N</dt><dd>enqueue N jobs</dd>
        <dt>GET /lane</dt><dd><a href="/lane">the lane values as JSON</a></dd>
        <dt>GET /healthz</dt><dd><a href="/healthz">the ready check</a>: <span class="dl-ok">ok</span></dd>
      </dl>
    </div>
  </main>
  <footer class="dl-footer">api.mjs and worker.mjs, node:http with redis</footer>
</div>
<script>
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => "&#" + c.charCodeAt(0) + ";");
const time = (ms) => new Date(ms).toLocaleTimeString();

function render(state) {
  const busy = Object.values(state.workers).filter((w) => w.state === "busy").length;
  document.getElementById("queue").innerHTML =
    "<dt>waiting</dt><dd>" + state.waiting + "</dd>" +
    "<dt>in flight</dt><dd>" + busy + "</dd>" +
    "<dt>finished</dt><dd class='dl-ok'>" + state.finished.length + " shown, newest first</dd>";

  const counts = {};
  for (const job of state.finished) counts[job.worker] = (counts[job.worker] ?? 0) + 1;
  const workers = Object.entries(state.workers);
  document.getElementById("workers").innerHTML = workers.length
    ? workers.map(([name, w]) => {
        const status = w.state === "busy" ? "<span class='dl-url'>busy with job " + esc(w.job) + "</span>"
          : w.state === "stopped" ? "<span class='dl-bad'>stopped</span>"
          : "<span class='dl-ok'>idle</span>";
        return "<dt>" + esc(name) + "</dt><dd>" + status + " <span class='dl-key'>pid " + esc(w.pid) + "</span>, " + (counts[name] ?? 0) + " jobs below</dd>";
      }).join("")
    : "<dt>none yet</dt><dd>no worker has connected to this queue</dd>";

  document.getElementById("finished").innerHTML = state.finished.length
    ? "<table class='jobs'><tr><th>job</th><th>worker</th><th>took</th><th>finished</th></tr>" +
      state.finished.map((j) => "<tr><td>#" + esc(j.id) + "</td><td class='dl-key'>" + esc(j.worker) + "</td><td>" + esc(j.took_ms) + " ms</td><td>" + esc(time(j.finished_at)) + "</td></tr>").join("") +
      "</table>"
    : "<pre>no finished jobs yet</pre>";
}

async function refresh() {
  try {
    const res = await fetch("/api/jobs");
    if (res.ok) render(await res.json());
  } catch {}
}

document.getElementById("enqueue").addEventListener("submit", async (event) => {
  event.preventDefault();
  const count = new FormData(event.target).get("count");
  await fetch("/api/jobs?count=" + encodeURIComponent(count), { method: "POST" });
  refresh();
});

render(${initial});
setInterval(refresh, 1000);
</script>
</body>
</html>
`;
}

function send(res, status, type, body) {
  res.writeHead(status, { "content-type": type });
  res.end(body);
}

const json = (res, status, body) =>
  send(res, status, "application/json", JSON.stringify(body, null, 2) + "\n");

async function handle(req, res) {
  const url = new URL(req.url, "http://localhost");
  const path = url.pathname;

  if (path === "/healthz") return send(res, 200, "text/plain; charset=utf-8", "ok");
  if (path === "/lane") return json(res, 200, laneInfo(req));
  if (assets[path]) {
    return send(res, 200, assets[path], readFileSync(new URL(`.${path}`, import.meta.url)));
  }
  if (path === "/api/jobs" && req.method === "POST") {
    const count = Number(url.searchParams.get("count") ?? 1);
    if (!Number.isInteger(count) || count < 1 || count > 100) {
      return json(res, 400, { error: "count must be a whole number from 1 to 100" });
    }
    return json(res, 200, { queue: keys.waiting, enqueued: await enqueue(count) });
  }
  if (path === "/api/jobs") return json(res, 200, { ...laneInfo(req), ...(await queueState()) });
  if (path === "/")
    return send(res, 200, "text/html; charset=utf-8", page(laneInfo(req), await queueState()));
  send(res, 404, "text/plain; charset=utf-8", "not found\n");
}

const server = createServer((req, res) => {
  handle(req, res).catch((err) => {
    console.error(err);
    send(res, 500, "text/plain; charset=utf-8", `${err.message}\n`);
  });
});

server.listen(port, host, () => {
  console.log(`queue-workers api listening on http://${host}:${port}`);
});
