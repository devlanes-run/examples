import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import pg from "pg";
import { createClient } from "redis";

const env = process.env;
const port = Number(env.PORT);
const host = env.HOST ?? "127.0.0.1";
const database = new URL(env.DATABASE_URL);
const redisDb = new URL(env.REDIS_URL).pathname.slice(1);

const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
const redis = createClient({ url: env.REDIS_URL });
redis.on("error", (err) => console.error(`redis: ${err.message}`));
await redis.connect();

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

async function state() {
  const [server, rows, visits] = await Promise.all([
    pool.query("SELECT current_setting('server_version') AS version"),
    pool.query("SELECT id, body, created_at FROM notes ORDER BY id DESC LIMIT 10"),
    redis.get("visits"),
  ]);
  const count = await pool.query("SELECT count(*)::int AS n FROM notes");
  return {
    postgres: {
      container: env.POSTGRES_CONTAINER,
      port: Number(database.port),
      database: database.pathname.slice(1),
      version: server.rows[0].version,
      rows: count.rows[0].n,
      latest: rows.rows,
    },
    redis: {
      port: Number(new URL(env.REDIS_URL).port),
      db: Number(redisDb),
      visits: Number(visits ?? 0),
    },
  };
}

const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function page(info, data) {
  const url = info.url
    ? `<a href="${escape(info.url)}">${escape(info.url)}</a>`
    : `<span class="dl-bad">not through the proxy</span>`;
  const notes = data.postgres.latest.length
    ? data.postgres.latest
        .map((n) => `#${escape(n.id)}  ${escape(n.created_at.toISOString())}  ${escape(n.body)}`)
        .join("\n")
    : "no rows yet";
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
    <nav class="dl-nav"><a href="https://github.com/devlanes-run/examples/tree/main/infra-postgres-per-lane">infra-postgres-per-lane on GitHub</a></nav>
  </header>
  <main class="dl-main">
    <h1 class="dl-title">This is lane ${escape(info.lane)} of ${escape(info.project)}.</h1>
    <p class="dl-lede">The <code>${escape(info.service)}</code> service answered from the worktree on <code>${escape(info.branch)}</code>, with a Postgres of its own and a database index in the shared Redis.</p>
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

    <h2 class="dl-h2">Postgres, one per lane</h2>
    <p class="dl-lede">This lane's own container, on a host port from the lane's block. <code>devlanes lane clean</code> removes it with its volume.</p>
    <div class="dl-card">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>per_lane: [postgres]</span><span></span></div>
      <dl class="dl-rows">
        <dt>container</dt><dd class="dl-ok">${escape(data.postgres.container)}</dd>
        <dt>port</dt><dd>${escape(data.postgres.port)}</dd>
        <dt>database</dt><dd>${escape(data.postgres.database)} <span class="dl-key">Postgres ${escape(data.postgres.version)}</span></dd>
        <dt>rows</dt><dd>${escape(data.postgres.rows)} in notes</dd>
      </dl>
      <pre>${notes}</pre>
    </div>
    <form method="post" action="/notes"><button class="dl-button">Add a row</button></form>

    <h2 class="dl-h2">Redis, shared</h2>
    <p class="dl-lede">One Redis for every lane. This lane counts its visits in database ${escape(data.redis.db)}, so other lanes keep their own count.</p>
    <div class="dl-card">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>redis_db: \${{ lane.index }}</span><span></span></div>
      <dl class="dl-rows">
        <dt>port</dt><dd>${escape(data.redis.port)}</dd>
        <dt>database</dt><dd>${escape(data.redis.db)}</dd>
        <dt>visits</dt><dd class="dl-ok">${escape(data.redis.visits)}</dd>
      </dl>
    </div>
    <form method="post" action="/visits"><button class="dl-button">Add a visit</button></form>

    <h2 class="dl-h2">Routes</h2>
    <div class="dl-card">
      <dl class="dl-rows">
        <dt>GET /api/state</dt><dd><a href="/api/state">Postgres and Redis as JSON</a></dd>
        <dt>GET /lane</dt><dd><a href="/lane">the lane values as JSON</a></dd>
        <dt>GET /healthz</dt><dd><a href="/healthz">the ready check</a>: <span class="dl-ok">ok</span></dd>
      </dl>
    </div>
  </main>
  <footer class="dl-footer">server.mjs, node:http with pg and redis</footer>
</div>
</body>
</html>
`;
}

function send(res, status, type, body) {
  res.writeHead(status, { "content-type": type });
  res.end(body);
}

async function handle(req, res) {
  const path = new URL(req.url, "http://localhost").pathname;

  if (path === "/healthz") return send(res, 200, "text/plain; charset=utf-8", "ok");
  if (path === "/lane") {
    return send(res, 200, "application/json", JSON.stringify(laneInfo(req), null, 2) + "\n");
  }
  if (assets[path]) {
    return send(res, 200, assets[path], readFileSync(new URL(`.${path}`, import.meta.url)));
  }
  if (path === "/api/state") {
    const body = { ...laneInfo(req), ...(await state()) };
    return send(res, 200, "application/json", JSON.stringify(body, null, 2) + "\n");
  }
  if (req.method === "POST" && path === "/notes") {
    await pool.query("INSERT INTO notes (body) VALUES ($1)", [
      `added in lane ${env.DEVLANES_LANE}`,
    ]);
    res.writeHead(303, { location: "/" });
    return res.end();
  }
  if (req.method === "POST" && path === "/visits") {
    await redis.incr("visits");
    res.writeHead(303, { location: "/" });
    return res.end();
  }
  if (path === "/")
    return send(res, 200, "text/html; charset=utf-8", page(laneInfo(req), await state()));
  send(res, 404, "text/plain; charset=utf-8", "not found\n");
}

const server = createServer((req, res) => {
  handle(req, res).catch((err) => {
    console.error(err);
    send(res, 500, "text/plain; charset=utf-8", `${err.message}\n`);
  });
});

server.listen(port, host, () => {
  console.log(`postgres-per-lane listening on http://${host}:${port}`);
});
