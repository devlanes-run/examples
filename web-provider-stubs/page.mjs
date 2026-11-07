// HTML and HTTP helpers shared by api.mjs and stub.mjs.
import { readFileSync } from "node:fs";

const env = process.env;

const assets = {
  "/devlanes.css": "text/css; charset=utf-8",
  "/app.css": "text/css; charset=utf-8",
  "/logo.svg": "image/svg+xml",
};

export function laneInfo(req) {
  // Only requests that came through the devlanes proxy carry X-Forwarded-Host.
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

export const escape = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const link = (url) => `<a href="${escape(url)}">${escape(url)}</a>`;

export function card(title, content) {
  return `<div class="dl-card">
  <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>${escape(title)}</span><span></span></div>
  ${content}
</div>`;
}

export function rows(entries) {
  return `<dl class="dl-rows">${entries.map(([k, v]) => `<dt>${escape(k)}</dt><dd>${v}</dd>`).join("")}</dl>`;
}

export function page(info, { lede, body }) {
  const url = info.url ? link(info.url) : `<span class="dl-bad">not through the proxy</span>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(info.service)}, lane ${escape(info.lane)} of ${escape(info.project)}</title>
<link rel="icon" href="/logo.svg">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap">
<link rel="stylesheet" href="/devlanes.css">
<link rel="stylesheet" href="/app.css">
</head>
<body style="--dl-lane: var(--dl-lane-${info.lane % 4})">
<div class="dl-page">
  <header class="dl-header">
    <a class="dl-brand" href="https://devlanes.run"><img src="/logo.svg" alt="" width="32" height="32">devlanes</a>
    <nav class="dl-nav"><a href="https://github.com/devlanes-run/examples/tree/main/web-provider-stubs">web-provider-stubs on GitHub</a></nav>
  </header>
  <main class="dl-main">
    <h1 class="dl-title">This is lane ${escape(info.lane)} of <span class="nowrap">${escape(info.project)}.</span></h1>
    <p class="dl-lede">${lede}</p>
    ${card(`${info.project}@${info.lane}:${info.service}`, rows([
      ["lane", `${escape(info.lane)} <span class="dl-key">${escape(info.lane_name)}</span>`],
      ["branch", escape(info.branch)],
      ["service", escape(info.service)],
      ["port", escape(info.port)],
      ["url", url],
    ]))}
    ${body}
  </main>
  <footer class="dl-footer">node:http, no dependencies</footer>
</div>
</body>
</html>
`;
}

export function sendJson(res, status, value) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(value, null, 2) + "\n");
}

export function sendHtml(res, status, html) {
  res.writeHead(status, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
}

// Answers /healthz, /lane and the static files; returns false for every other path.
export function serveCommon(req, res, path) {
  if (path === "/healthz") {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end("ok");
    return true;
  }
  if (path === "/lane") {
    sendJson(res, 200, laneInfo(req));
    return true;
  }
  if (assets[path]) {
    res.writeHead(200, { "content-type": assets[path] });
    res.end(readFileSync(new URL(`.${path}`, import.meta.url)));
    return true;
  }
  return false;
}

export async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  const type = req.headers["content-type"] ?? "";
  if (type.startsWith("application/json")) return text ? JSON.parse(text) : {};
  if (type.startsWith("application/x-www-form-urlencoded")) return Object.fromEntries(new URLSearchParams(text));
  return {};
}
