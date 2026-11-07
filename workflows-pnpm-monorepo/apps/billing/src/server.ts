// Node runs this file as is (type stripping), so only erasable TypeScript here.
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import type { ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import { laneJson, serverEnv } from "@acme/config";

const env = serverEnv(process.env);
// Another devlanes project (pnpm-monorepo at the example's root); empty while
// none of its lanes runs.
const monorepoWebUrl = process.env.MONOREPO_WEB_URL ?? "";

// The page look comes from the shared @acme/ui package, as in the Vite apps.
const asset = (name: string) =>
  readFileSync(fileURLToPath(import.meta.resolve(`@acme/ui/${name}`)));
const css = asset("devlanes.css");
const logo = asset("logo.svg");
const repo = "https://github.com/devlanes-run/examples/tree/main/workflows-pnpm-monorepo";

const invoices = [
  { id: "INV-1001", account: "Acme Rockets", total_cents: 1188000, status: "paid" },
  { id: "INV-1002", account: "Acme Anvils", total_cents: 138600, status: "open" },
  { id: "INV-1003", account: "Acme Magnets", total_cents: 8700, status: "overdue" },
];

const escape = (value: unknown) =>
  String(value).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c,
  );

function page(lane: ReturnType<typeof laneJson>) {
  const monorepo = monorepoWebUrl
    ? `<a href="${escape(monorepoWebUrl)}">${escape(monorepoWebUrl)}</a> (project pnpm-monorepo)`
    : `<span class="dl-bad">no lane of pnpm-monorepo runs; start one at the example's root, then devlanes restart web here</span>`;
  const rows = invoices
    .map(
      (i) =>
        `<dt class="dl-key">${i.id}</dt><dd>${escape(i.account)}, $${(i.total_cents / 100).toFixed(2)}, <span class="${i.status === "overdue" ? "dl-bad" : "dl-ok"}">${i.status}</span></dd>`,
    )
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap">
  <link rel="stylesheet" href="/devlanes.css">
  <title>pnpm-billing</title>
</head>
<body>
<div class="dl-page">
  <header class="dl-header">
    <a class="dl-brand" href="/"><img src="/logo.svg" alt="" width="32" height="32">devlanes</a>
    <nav class="dl-nav"><a href="${repo}">workflows-pnpm-monorepo on GitHub</a></nav>
  </header>
  <main class="dl-main">
    <h1 class="dl-title">This is lane ${lane.lane} of <span style="white-space: nowrap">${escape(lane.project)}.</span></h1>
    <p class="dl-lede">Served by <code>${escape(lane.service)}</code> from the <code>${escape(lane.branch)}</code> worktree.
      A separate devlanes project, declared in <code>apps/billing/devlanes.yaml</code>, with its own lanes and hostnames.</p>
    <section class="dl-card" style="--dl-lane: var(--dl-lane-${lane.lane % 4})">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>lane</span><span></span></div>
      <dl class="dl-rows">
        <dt>lane</dt><dd>${lane.lane} (${escape(lane.lane_name)})</dd>
        <dt>branch</dt><dd>${escape(lane.branch)}</dd>
        <dt>service</dt><dd>${escape(lane.service)}</dd>
        <dt>port</dt><dd>${lane.port}</dd>
        <dt>url</dt><dd class="dl-url">${escape(lane.url)}</dd>
      </dl>
    </section>
    <h2 class="dl-h2">Invoices</h2>
    <section class="dl-card" style="--dl-lane: var(--dl-lane-${lane.lane % 4})">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>/api/invoices</span><span></span></div>
      <dl class="dl-rows">${rows}</dl>
    </section>
    <h2 class="dl-h2">The main app</h2>
    <section class="dl-card" style="--dl-lane: var(--dl-lane-${lane.lane % 4})">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>MONOREPO_WEB_URL</span><span></span></div>
      <dl class="dl-rows"><dt>web</dt><dd>${monorepo}</dd></dl>
    </section>
  </main>
  <footer class="dl-footer">devlanes examples: workflows-pnpm-monorepo, apps/billing</footer>
</div>
</body>
</html>`;
}

function send(res: ServerResponse, status: number, type: string, body: string | Buffer) {
  res.writeHead(status, { "content-type": `${type}; charset=utf-8` });
  res.end(body);
}

const server = createServer((req, res) => {
  const { pathname } = new URL(req.url ?? "/", "http://localhost");
  const forwardedHost = req.headers["x-forwarded-host"];
  const lane = laneJson(
    env,
    Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost,
    req.headers.host,
  );

  switch (`${req.method} ${pathname}`) {
    case "GET /healthz":
      return send(res, 200, "text/plain", "ok");
    case "GET /lane":
      return send(res, 200, "application/json", JSON.stringify(lane, null, 2));
    case "GET /api/invoices":
      return send(
        res,
        200,
        "application/json",
        JSON.stringify({ lane: env.lane, invoices }, null, 2),
      );
    case "GET /devlanes.css":
      return send(res, 200, "text/css", css);
    case "GET /logo.svg":
      return send(res, 200, "image/svg+xml", logo);
    case "GET /":
      return send(res, 200, "text/html", page(lane));
    default:
      return send(
        res,
        404,
        "application/json",
        JSON.stringify({ error: `no route for ${req.method} ${pathname}` }),
      );
  }
});

server.listen(env.port, env.host, () => {
  console.log(`billing listening on http://${env.host}:${env.port}`);
});
