import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const publicDir = new URL("../public/", import.meta.url);
const assets = {
  "/devlanes.css": ["text/css; charset=utf-8", readFileSync(new URL("devlanes.css", publicDir))],
  "/logo.svg": ["image/svg+xml", readFileSync(new URL("logo.svg", publicDir))],
};

const env = process.env;
export const LANE_DOMAIN = env.LANE_DOMAIN;
export const SITES_DOMAIN = env.SITES_DOMAIN;
export const TENANTS = {
  alice: { shop: "Alice's Plants", items: ["Monstera", "Fern", "Cactus"] },
  bob: { shop: "Bob's Bikes", items: ["Road bike", "Helmet", "Pump"] },
};

export function laneInfo(req) {
  const forwarded = req.headers["x-forwarded-host"];
  return {
    project: env.DEVLANES_LANE_PROJECT,
    lane: Number(env.DEVLANES_LANE),
    lane_name: env.DEVLANES_LANE_NAME,
    branch: env.LANE_LABEL,
    service: env.DEVLANES_SERVICE,
    port: Number(env.PORT),
    url: forwarded ? `https://${forwarded}` : null,
  };
}

// The proxy may run on 8443 instead of 443; links to other hostnames keep the port the browser used.
export function portSuffix(req) {
  const match = /:\d+$/.exec(req.headers.host ?? "");
  return match ? match[0] : "";
}

export function hostname(req) {
  return (req.headers.host ?? "").replace(/:\d+$/, "").toLowerCase();
}

export function cookies(req) {
  const out = {};
  for (const part of (req.headers.cookie ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

export const esc = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function card(title, rows) {
  const body = rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("");
  return `<section class="dl-card"><div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>${esc(title)}</span><span></span></div><dl class="dl-rows">${body}</dl></section>`;
}

export function page(req, { lede, cards = [] }) {
  const info = laneInfo(req);
  const laneCard = card("lane", [
    ["lane", `${info.lane} (${esc(info.lane_name)})`],
    ["branch", esc(info.branch)],
    ["service", esc(info.service)],
    ["port", info.port],
    ["url", info.url ? `<span class="dl-url">${esc(info.url)}</span>` : `<span class="dl-bad">not through the proxy</span>`],
  ]);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(info.service)} - lane ${info.lane} of ${esc(info.project)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap">
<link rel="stylesheet" href="/devlanes.css">
<style>.dl-card { --dl-lane: var(--dl-lane-${info.lane % 4}); }</style>
</head>
<body>
<div class="dl-page">
<header class="dl-header">
<a class="dl-brand" href="/"><img src="/logo.svg" alt="" width="32" height="32">devlanes</a>
<nav class="dl-nav"><a href="https://github.com/devlanes-run/examples/tree/main/web-wildcard-tenants">web-wildcard-tenants on GitHub</a></nav>
</header>
<main class="dl-main">
<h1 class="dl-title">This is lane ${info.lane} of ${esc(info.project)}.</h1>
<p class="dl-lede">${lede}</p>
${laneCard}
${cards.join("\n")}
</main>
</div>
</body>
</html>
`;
}

export function send(res, status, body, headers = {}) {
  res.writeHead(status, { "content-type": "text/html; charset=utf-8", ...headers });
  res.end(body);
}

export function serve(handler) {
  const server = createServer((req, res) => {
    const path = new URL(req.url, "http://x").pathname;
    if (path === "/healthz") {
      res.writeHead(200, { "content-type": "text/plain" });
      return res.end("ok");
    }
    if (path === "/lane") {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(laneInfo(req)) + "\n");
    }
    if (path === "/request") {
      const body = { service: env.DEVLANES_SERVICE, host: hostname(req), cookie: req.headers.cookie ?? null };
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(body) + "\n");
    }
    if (assets[path]) {
      const [type, data] = assets[path];
      res.writeHead(200, { "content-type": type });
      return res.end(data);
    }
    handler(req, res, path);
  });
  const host = env.HOST ?? "127.0.0.1";
  server.listen(Number(env.PORT), host, () => {
    console.log(`${env.DEVLANES_SERVICE} listening on http://${host}:${env.PORT}`);
  });
}
