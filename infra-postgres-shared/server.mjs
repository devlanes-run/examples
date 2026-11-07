import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import pg from "pg";

const env = process.env;
const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
const database = new URL(env.DATABASE_URL).pathname.slice(1);
const origins = (env.DEVLANES_ORIGINS ?? "").split(",").filter(Boolean);

// reset-db drops the database with --force, which ends idle connections; without a
// handler the pool's error event would crash the server.
pool.on("error", (err) => console.error(`pool: ${err.message}`));

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
    branch: env.LANE_LABEL,
    service: env.DEVLANES_SERVICE,
    port: Number(env.PORT),
    url: forwarded ? `https://${forwarded}` : `http://${req.headers.host}`,
    database,
  };
}

async function listNotes() {
  const { rows } = await pool.query("SELECT id, body, created_at FROM notes ORDER BY id DESC");
  return rows;
}

async function addNote(body) {
  const { rows } = await pool.query(
    "INSERT INTO notes (body) VALUES ($1) RETURNING id, body, created_at",
    [body],
  );
  return rows[0];
}

async function readBody(req) {
  let data = "";
  for await (const chunk of req) data += chunk;
  return data;
}

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function page(info, notes, error) {
  const items = notes.length
    ? notes.map((n) => `<dt>#${n.id}</dt><dd>${escape(n.body)}</dd>`).join("")
    : `<dt>-</dt><dd>No notes yet.</dd>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(info.project)} lane ${info.lane}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap">
<link rel="stylesheet" href="/devlanes.css">
<style>
  .db { margin: 0 auto 32px; font: 700 clamp(22px, 3vw, 32px) var(--dl-mono); overflow-wrap: anywhere; }
  .add { display: flex; gap: 8px; max-width: 680px; margin: 0 auto 24px; }
  .add input { flex: 1; padding: 8px 12px; border: 1px solid var(--dl-ink); border-radius: 5px; font: 16px var(--dl-sans); background: #fff8dc; }
</style>
</head>
<body style="--dl-lane: var(--dl-lane-${info.lane % 4})">
<div class="dl-page">
  <header class="dl-header">
    <a class="dl-brand" href="/"><img src="/logo.svg" alt="">devlanes</a>
    <nav class="dl-nav"><a href="https://github.com/devlanes-run/examples/tree/main/infra-postgres-shared">infra-postgres-shared on GitHub</a></nav>
  </header>
  <main class="dl-main">
    <h1 class="dl-title">This is lane ${info.lane} of ${escape(info.project)}.</h1>
    <p class="dl-lede">The ${escape(info.service)} service of the <code>${escape(info.branch)}</code> worktree, reading notes from its own database in the shared Postgres container:</p>
    <p class="db">${escape(info.database)}</p>
    <div class="dl-card">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>GET /lane</span><span></span></div>
      <dl class="dl-rows">
        <dt>lane</dt><dd>${info.lane} (${escape(info.lane_name)})</dd>
        <dt>branch</dt><dd>${escape(info.branch)}</dd>
        <dt>service</dt><dd>${escape(info.service)}</dd>
        <dt>port</dt><dd>${info.port}</dd>
        <dt>url</dt><dd><a href="${escape(info.url)}">${escape(info.url)}</a></dd>
        <dt>database</dt><dd class="dl-key">${escape(info.database)}</dd>
      </dl>
    </div>
    <h2 class="dl-h2">Notes</h2>
    <form class="add" method="post" action="/notes">
      <input name="body" required maxlength="200" placeholder="A note for ${escape(info.database)}">
      <button class="dl-button" type="submit">Add note</button>
    </form>
    <div class="dl-card">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>SELECT * FROM notes</span><span></span></div>
      ${error ? `<pre class="dl-bad">${escape(error)}</pre>` : `<dl class="dl-rows">${items}</dl>`}
    </div>
  </main>
  <footer class="dl-footer"><a href="/api/notes">/api/notes</a> | <a href="/lane">/lane</a> | <a href="/healthz">/healthz</a></footer>
</div>
</body>
</html>`;
}

function send(res, status, type, body) {
  res.writeHead(status, { "content-type": type });
  res.end(body);
}

const json = (res, status, value) =>
  send(res, status, "application/json", JSON.stringify(value, null, 2));

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  try {
    if (req.method === "POST") {
      // CSRF: a browser POST must come from one of this lane's origins.
      const origin = req.headers.origin;
      if (origin && !origins.includes(origin))
        return send(res, 403, "text/plain", "origin not allowed\n");
    }
    if (req.method === "GET" && assets[pathname]) {
      const [type, body] = assets[pathname];
      return send(res, 200, type, body);
    }
    if (req.method === "GET" && pathname === "/healthz")
      return send(res, 200, "text/plain", "ok\n");
    if (req.method === "GET" && pathname === "/lane") return json(res, 200, laneInfo(req));
    if (req.method === "GET" && pathname === "/api/notes") return json(res, 200, await listNotes());
    if (req.method === "POST" && pathname === "/api/notes") {
      const { body } = JSON.parse((await readBody(req)) || "{}");
      if (!body) return json(res, 400, { error: "body is required" });
      return json(res, 201, await addNote(String(body)));
    }
    if (req.method === "POST" && pathname === "/notes") {
      const body = new URLSearchParams(await readBody(req)).get("body");
      if (body) await addNote(body);
      res.writeHead(303, { location: "/" });
      return res.end();
    }
    if (req.method === "GET" && pathname === "/") {
      const info = laneInfo(req);
      let notes = [];
      let error;
      try {
        notes = await listNotes();
      } catch (err) {
        error = err.message;
      }
      return send(res, 200, "text/html; charset=utf-8", page(info, notes, error));
    }
    send(res, 404, "text/plain", "not found\n");
  } catch (err) {
    json(res, 500, { error: err.message });
  }
}).listen(Number(env.PORT), env.HOST, () => {
  console.log(`api listening on http://${env.HOST}:${env.PORT}, database ${database}`);
});
