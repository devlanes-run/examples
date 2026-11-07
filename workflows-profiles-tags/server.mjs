import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const env = process.env;
const role = env.ROLE;
const service = env.DEVLANES_SERVICE;
const port = Number(env.PORT);
const host = env.HOST ?? "127.0.0.1";
const origins = (env.DEVLANES_ORIGINS ?? "").split(",").filter(Boolean);
const repo = "https://github.com/devlanes-run/examples/tree/main/workflows-profiles-tags";

const seeds = {
  users: [
    { id: 1, name: "Ada Acme", email: "ada@example.invalid" },
    { id: 2, name: "Grace Acme", email: "grace@example.invalid" },
  ],
  invoices: [
    { id: 1, name: "INV-0001 Ada Acme 49.00 EUR" },
    { id: 2, name: "INV-0002 Grace Acme 12.50 EUR" },
  ],
  products: [
    { id: 1, name: "Lane socks" },
    { id: 2, name: "Worktree mug" },
    { id: 3, name: "Proxy hoodie" },
  ],
};

function save(file, data) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

function load(file, seed) {
  if (!existsSync(file)) save(file, seed);
  return JSON.parse(readFileSync(file, "utf8"));
}

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

const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function send(res, status, type, body) {
  res.writeHead(status, { "content-type": type });
  res.end(body);
}

const json = (res, status, data) =>
  send(res, status, "application/json", JSON.stringify(data, null, 2) + "\n");

const assets = {
  "/devlanes.css": "text/css; charset=utf-8",
  "/logo.svg": "image/svg+xml",
};

// Shared routes: health, lane JSON and the page assets.
function common(req, res, path) {
  if (path === "/healthz") return (send(res, 200, "text/plain; charset=utf-8", "ok"), true);
  if (path === "/lane") return (json(res, 200, laneInfo(req)), true);
  if (assets[path]) {
    return (send(res, 200, assets[path], readFileSync(new URL(`.${path}`, import.meta.url))), true);
  }
  return false;
}

// A POST from a browser carries Origin; only the lane's own origins may write.
const crossSite = (req) => req.headers.origin && !origins.includes(req.headers.origin);

async function readBody(req) {
  let body = "";
  for await (const chunk of req) body += chunk;
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

function serve(handler) {
  createServer((req, res) => {
    const path = new URL(req.url, "http://localhost").pathname;
    if (common(req, res, path)) return;
    Promise.resolve(handler(req, res, path)).catch((error) => {
      console.error(error);
      if (!res.headersSent) send(res, 500, "text/plain; charset=utf-8", `${error.message}\n`);
    });
  }).listen(port, host, () => {
    console.log(`${service} (${role}) listening on http://${host}:${port}`);
  });
}

function api() {
  const kind = env.RECORDS;
  const file = env.DATA_FILE;
  const single = kind.replace(/s$/, "");
  console.log(`${service} keeps its ${kind} in ${file}`);

  serve(async (req, res, path) => {
    const origin = req.headers.origin;
    if (origin && origins.includes(origin)) {
      res.setHeader("access-control-allow-origin", origin);
      res.setHeader("vary", "origin");
    }
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-methods": "GET, POST",
        "access-control-allow-headers": "content-type",
      });
      return res.end();
    }
    if (path === "/" && req.method === "GET") {
      return json(res, 200, {
        ...laneInfo(req),
        data_file: file,
        records: kind,
        items: load(file, seeds[kind]),
      });
    }
    if (path === `/api/${kind}` && req.method === "GET") {
      return json(res, 200, load(file, seeds[kind]));
    }
    if (path === `/api/${kind}` && req.method === "POST") {
      if (crossSite(req))
        return send(res, 403, "text/plain; charset=utf-8", "origin not allowed\n");
      const body = await readBody(req);
      const items = load(file, seeds[kind]);
      const id = Math.max(0, ...items.map((item) => item.id)) + 1;
      const item = { id, name: String(body.name ?? `${single} ${id}`) };
      if (kind === "users") item.email = `${single}${id}@example.invalid`;
      items.push(item);
      save(file, items);
      console.log(`added ${single} ${id} to ${file}`);
      return json(res, 201, item);
    }
    send(res, 404, "text/plain; charset=utf-8", "not found\n");
  });
}

function head(title) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<link rel="icon" href="/logo.svg">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap">
<link rel="stylesheet" href="/devlanes.css">
</head>`;
}

function layout(info, body) {
  const url = info.url
    ? `<a href="${escape(info.url)}">${escape(info.url)}</a>`
    : `<span class="dl-bad">not through the proxy</span>`;
  return `${head(`${info.service}, lane ${info.lane} of ${info.project}`)}
<body style="--dl-lane: var(--dl-lane-${info.lane % 4})">
<div class="dl-page">
  <header class="dl-header">
    <a class="dl-brand" href="https://devlanes.run"><img src="/logo.svg" alt="" width="32" height="32">devlanes</a>
    <nav class="dl-nav"><a href="${repo}">workflows-profiles-tags on GitHub</a></nav>
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
  <footer class="dl-footer">server.mjs as ${escape(role)}, node:http, no dependencies</footer>
</div>
</body>
</html>
`;
}

const envPrefix = (name) => name.toUpperCase().replace(/[^A-Z0-9]/g, "_");

function web() {
  const apis = (env.APIS ?? "").split(",").filter(Boolean);
  const target = (name) => ({
    url: env[`${envPrefix(name)}_URL`],
    publicUrl: env[`${envPrefix(name)}_PUBLIC_URL`],
  });

  async function card(name) {
    const { url, publicUrl } = target(name);
    let rows;
    try {
      const answer = await (await fetch(`${url}/`, { signal: AbortSignal.timeout(2000) })).json();
      const items = answer.items.map((item) => escape(item.name)).join("<br>");
      const single = answer.records.replace(/s$/, "");
      rows = `
        <dt>answered by</dt><dd class="dl-ok">lane ${escape(answer.lane)} <span class="dl-key">${escape(answer.lane_name)}</span></dd>
        <dt>data file</dt><dd>${escape(answer.data_file)}</dd>
        <dt>${escape(answer.records)}</dt><dd>${answer.items.length}<br>${items}</dd>
        <dt></dt><dd><form method="post" action="/add?api=${escape(name)}&amp;records=${escape(answer.records)}"><button class="dl-button">Add a ${escape(single)}</button></form></dd>`;
    } catch (error) {
      rows = `
        <dt>answered by</dt><dd class="dl-bad">nothing: ${escape(error.cause?.code ?? error.name)}, ${escape(name)} is not running</dd>`;
    }
    return `
    <div class="dl-card">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>${escape(name)}</span><span></span></div>
      <dl class="dl-rows">
        <dt>public_url</dt><dd><a href="${escape(publicUrl)}">${escape(publicUrl)}</a></dd>
        <dt>fetched from</dt><dd>${escape(url)}</dd>${rows}
      </dl>
    </div>`;
  }

  serve(async (req, res, path) => {
    if (path === "/" && req.method === "GET") {
      const cards = await Promise.all(apis.map(card));
      const body = `
    <h2 class="dl-h2">APIs this page calls</h2>
    <p class="dl-lede">The URLs come from this service's environment: the <code>web</code> template sets this lane's APIs, and the <code>attach</code> profile replaces them with lane 0's. Each API reports the data file it reads, which the <code>test</code> profile moves.</p>
${cards.join("\n")}`;
      return send(res, 200, "text/html; charset=utf-8", layout(laneInfo(req), body));
    }
    if (path === "/add" && req.method === "POST") {
      if (crossSite(req))
        return send(res, 403, "text/plain; charset=utf-8", "origin not allowed\n");
      const query = new URL(req.url, "http://localhost").searchParams;
      const name = query.get("api");
      const records = query.get("records") ?? "";
      if (!apis.includes(name) || !/^[a-z]+$/.test(records)) {
        return send(res, 400, "text/plain; charset=utf-8", "unknown api\n");
      }
      const answer = await fetch(`${target(name).url}/api/${records}`, { method: "POST" });
      if (!answer.ok)
        return send(res, 502, "text/plain; charset=utf-8", `${name} answered ${answer.status}\n`);
      res.writeHead(303, { location: "/" });
      return res.end();
    }
    send(res, 404, "text/plain; charset=utf-8", "not found\n");
  });
}

function docs() {
  const components = ["Button", "PriceTag", "CartDrawer", "InvoiceTable", "SignInForm"];
  serve((req, res, path) => {
    if (path !== "/" || req.method !== "GET")
      return send(res, 404, "text/plain; charset=utf-8", "not found\n");
    const body = `
    <h2 class="dl-h2">Components</h2>
    <p class="dl-lede">A stand-in for Storybook. It has <code>autostart: false</code>, so no profile starts it unless it names <code>docs</code> or <code>+docs</code>.</p>
    <div class="dl-card">
      <dl class="dl-rows">
${components.map((c, i) => `        <dt>${i + 1}</dt><dd>${c}</dd>`).join("\n")}
      </dl>
    </div>`;
    send(res, 200, "text/html; charset=utf-8", layout(laneInfo(req), body));
  });
}

function worker() {
  const file = env.DATA_FILE;
  const source = `${env.ACCOUNTS_API_URL}/api/users`;
  let down = false;
  console.log(`worker ready: ${service} reads ${source}, mail log in ${file}`);

  async function poll() {
    try {
      const users = await (await fetch(source, { signal: AbortSignal.timeout(2000) })).json();
      if (down) console.log(`accounts-api answers again at ${source}`);
      down = false;
      const log = load(file, { sent: [] });
      for (const user of users) {
        if (log.sent.some((mail) => mail.user === user.id)) continue;
        log.sent.push({ user: user.id, to: user.email, at: new Date().toISOString() });
        console.log(`sent welcome mail to ${user.name} <${user.email}>`);
      }
      save(file, log);
    } catch (error) {
      if (!down)
        console.log(`accounts-api unreachable at ${source}: ${error.cause?.code ?? error.name}`);
      down = true;
    }
  }
  poll();
  setInterval(poll, 3000);
}

const roles = { api, web, docs, worker };
if (!roles[role]) {
  console.error(`ROLE must be one of ${Object.keys(roles).join(", ")}, got ${role}`);
  process.exit(1);
}
roles[role]();
