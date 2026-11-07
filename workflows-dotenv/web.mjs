import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { laneInfo, serveCommon } from "./common.mjs";
import { urls } from "./urls.mjs";

const env = process.env;

const assets = {
  "/devlanes.css": "text/css; charset=utf-8",
  "/logo.svg": "image/svg+xml",
};

// devlanes reads the .env next to devlanes.yaml and, in a worktree that has none,
// the primary worktree's. The page reads the same file to list its key names.
function dotenvFile() {
  const own = join(process.cwd(), ".env");
  if (existsSync(own)) return { path: own, from: "this worktree" };
  const primary = join(env.DOTENV_ROOT, relative(env.LANE_PATH, process.cwd()), ".env");
  if (existsSync(primary)) return { path: primary, from: "the primary worktree" };
  return null;
}

function dotenvKeys(path) {
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/)?.[1])
    .filter(Boolean);
}

const isSecret = (key) => /TOKEN|SECRET|PASSWORD|DSN|KEY/.test(key);

function envState(key) {
  if (!(key in env)) return `<span class="dl-key">not in this process</span>`;
  if (env[key] === "") return "empty";
  if (isSecret(key))
    return `<span class="dl-ok">set</span> <span class="dl-key">value hidden</span>`;
  return `<span class="dl-ok">${escape(env[key])}</span>`;
}

async function fetchOrders() {
  try {
    // HTTPS through the devlanes proxy; devlanes points NODE_EXTRA_CA_CERTS at its CA.
    const res = await fetch(`${urls.api}/api/orders`, {
      headers: { authorization: `Bearer ${env.ACME_API_TOKEN}` },
      signal: AbortSignal.timeout(5000),
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, count: body?.orders?.length };
  } catch (err) {
    return { error: err.cause?.code ?? err.message };
  }
}

const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const link = (url) => `<a href="${escape(url)}">${escape(url)}</a>`;

function card(title, entries) {
  return `<div class="dl-card">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>${escape(title)}</span><span></span></div>
      <dl class="dl-rows">${entries.map(([k, v]) => `<dt>${escape(k)}</dt><dd>${v}</dd>`).join("")}</dl>
    </div>`;
}

function cookie(req, name) {
  for (const part of (req.headers.cookie ?? "").split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return null;
}

function page(info, file, orders) {
  const url = info.url ? link(info.url) : `<span class="dl-bad">not through the proxy</span>`;
  const fileRows = file
    ? [
        ["file", `${escape(file.path)} <span class="dl-key">from ${escape(file.from)}</span>`],
        ...dotenvKeys(file.path).map((key) => [key, envState(key)]),
      ]
    : [["file", `<span class="dl-bad">no .env; copy .env.example to .env</span>`]];
  const ordersRow =
    orders.status === 200
      ? `<span class="dl-ok">200, ${escape(orders.count)} orders</span>`
      : `<span class="dl-bad">${escape(orders.status ?? orders.error)}</span>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lane ${escape(info.lane)} of ${escape(info.project)}</title>
<link rel="icon" href="${escape(urls.assets)}/logo.svg">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap">
<link rel="stylesheet" href="${escape(urls.assets)}/devlanes.css">
</head>
<body style="--dl-lane: var(--dl-lane-${info.lane % 4})">
<div class="dl-page">
  <header class="dl-header">
    <a class="dl-brand" href="https://devlanes.run"><img src="${escape(urls.assets)}/logo.svg" alt="" width="32" height="32">devlanes</a>
    <nav class="dl-nav"><a href="https://github.com/devlanes-run/examples/tree/main/workflows-dotenv">workflows-dotenv on GitHub</a></nav>
  </header>
  <main class="dl-main">
    <h1 class="dl-title">This is lane ${escape(info.lane)} of <span style="white-space: nowrap">${escape(info.project)}.</span></h1>
    <p class="dl-lede">The <code>${escape(info.service)}</code> service answered from the worktree on <code>${escape(info.branch)}</code>.</p>
    ${card(`${info.project}@${info.lane}:${info.service}`, [
      ["lane", `${escape(info.lane)} <span class="dl-key">${escape(info.lane_name)}</span>`],
      ["branch", escape(info.branch)],
      ["service", escape(info.service)],
      ["port", escape(info.port)],
      ["url", url],
    ])}
    <h2 class="dl-h2">What reached this process from .env</h2>
    <p class="dl-lede">devlanes reads <code>.env</code> only for the <code>\${{ env.X }}</code> expressions in <code>devlanes.yaml</code>. A key reaches the process only when <code>global_env</code> names it, so <code>ACME_ADMIN_PASSWORD</code> stays out. Secret values are hidden here.</p>
    ${card(".env", fileRows)}
    <h2 class="dl-h2">Every URL from one domain</h2>
    <p class="dl-lede">devlanes sets <code>APP_DOMAIN</code> to the lane's domain. <code>urls.mjs</code> builds the rest, so lane 1 gets its own set without a second <code>.env</code>.</p>
    ${card("urls.mjs", [
      ["APP_DOMAIN", escape(urls.domain)],
      ["web", link(urls.web)],
      ["api", link(urls.api)],
      ["assets", `${link(urls.assets)} <span class="dl-key">this page's CSS and logo</span>`],
      ["cookie domain", `${escape(urls.cookieDomain)} <span class="dl-key">acme_session</span>`],
    ])}
    ${card("checks", [
      ["GET api/orders", `${ordersRow} <span class="dl-key">from web, with ACME_API_TOKEN</span>`],
      ["GET api/session", `<span id="session">waiting for the browser</span>`],
      [
        "Sentry",
        env.SENTRY_DSN
          ? `<span class="dl-ok">on</span>`
          : `off <span class="dl-key">SENTRY_DSN is empty</span>`,
      ],
    ])}
  </main>
  <footer class="dl-footer">web.mjs, node:http, no dependencies</footer>
</div>
<script>
  // The browser sends acme_session to api.${escape(urls.domain)} because the cookie's domain covers it.
  const out = document.getElementById("session");
  fetch(${JSON.stringify(`${urls.api}/api/session`)}, { credentials: "include" })
    .then((res) => res.json())
    .then(({ session }) => {
      out.className = session ? "dl-ok" : "dl-bad";
      out.textContent = session ? "api saw acme_session=" + session : "api got no cookie";
    })
    .catch((err) => { out.className = "dl-bad"; out.textContent = String(err); });
</script>
</body>
</html>
`;
}

const server = createServer(async (req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;
  if (serveCommon(req, res, path)) return;

  if (assets[path]) {
    res.writeHead(200, { "content-type": assets[path] });
    return res.end(readFileSync(new URL(`.${path}`, import.meta.url)));
  }
  if (path === "/") {
    const headers = { "content-type": "text/html; charset=utf-8" };
    if (!cookie(req, "acme_session")) {
      const session = randomBytes(4).toString("hex");
      headers["set-cookie"] =
        `acme_session=${session}; Domain=${urls.cookieDomain}; Path=/; Secure; HttpOnly; SameSite=Lax`;
    }
    res.writeHead(200, headers);
    return res.end(page(laneInfo(req), dotenvFile(), await fetchOrders()));
  }
  res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  res.end("not found\n");
});

server.listen(Number(env.PORT), env.HOST ?? "127.0.0.1", () => {
  console.log(`web listening on http://${env.HOST}:${env.PORT}, page at ${urls.web}`);
});
