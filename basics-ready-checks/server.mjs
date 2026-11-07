import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const env = process.env;
const port = Number(env.PORT);
const host = env.HOST ?? "127.0.0.1";
const service = env.DEVLANES_SERVICE ?? "server";
const lane = Number(env.DEVLANES_LANE ?? 0);
// Both come from devlanes.yaml, so each service's behaviour is visible in the config.
const allowedHost = env.ALLOWED_HOST;
const startDelay = Number(env.START_DELAY_MS ?? 0);

const CHECKS = {
  "http-check": ["ready.http", "Ready once GET /healthz on its port answers 2xx."],
  "tcp-check": [
    "ready.tcp",
    "Ready once its port accepts a TCP connection. The app is never asked anything.",
  ],
  "log-check": [
    "ready.log",
    'Waits 3 s, then ready once it prints a line matching "listening on http://".',
  ],
  "own-host": [
    "ready.http.host",
    "Answers only Host: its own hostname, so the check sends that Host header.",
  ],
  "own-host-cmd": ["ready.cmd", "The same app, checked by curl with a Host header instead."],
  "legacy-host": [
    "host_header: upstream",
    "Answers only Host: 127.0.0.1:<port>, so the proxy sends that instead of the hostname.",
  ],
  "slow-start": ["ready.http", "Sleeps 8 s before it listens, so the start shows it starting."],
};

const files = {
  "/devlanes.css": ["text/css", readFileSync(new URL("devlanes.css", import.meta.url))],
  "/logo.svg": ["image/svg+xml", readFileSync(new URL("logo.svg", import.meta.url))],
};

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

function hostAllowed(h = "") {
  if (!allowedHost) return true;
  // A hostname without a port also matches when the proxy fell back to 8443.
  return (
    h === allowedHost || (!allowedHost.includes(":") && h.replace(/:\d+$/, "") === allowedHost)
  );
}

function laneInfo(req) {
  const fwd = req.headers["x-forwarded-host"];
  return {
    project: env.DEVLANES_LANE_PROJECT,
    lane,
    lane_name: env.DEVLANES_LANE_NAME,
    branch: env.LANE_LABEL,
    service,
    port,
    url: fwd ? `https://${fwd}` : `http://${req.headers.host}`,
  };
}

function rows(pairs) {
  return `<dl class="dl-rows">${pairs.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`;
}

function card(title, body) {
  return `<section class="dl-card" style="--dl-lane: var(--dl-lane-${lane % 4})">
  <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>${esc(title)}</span><span></span></div>
  ${body}
</section>`;
}

function page(req) {
  const info = laneInfo(req);
  const laneCard = card(
    "lane",
    rows([
      ["lane", `${info.lane} <span class="dl-key">${esc(info.lane_name)}</span>`],
      ["branch", esc(info.branch)],
      ["service", esc(info.service)],
      ["port", esc(info.port)],
      ["url", `<span class="dl-url">${esc(info.url)}</span>`],
    ]),
  );

  let lede;
  let more;
  if (service === "index") {
    lede = `Served by <code>index</code> from the <code>${esc(info.branch)}</code> worktree. Each service below waits for another kind of <code>ready</code> check before <code>devlanes start</code> counts it up.`;
    more = card(
      "services",
      rows(
        Object.entries(CHECKS).map(([name, [check, about]]) => {
          const url = env[`${name.toUpperCase().replaceAll("-", "_")}_URL`];
          return [
            `<a href="${esc(url)}">${esc(name)}</a>`,
            `<span class="dl-ok">${esc(check)}</span> ${esc(about)}`,
          ];
        }),
      ),
    );
  } else {
    const [check, about] = CHECKS[service] ?? ["ready", ""];
    lede = `Served by <code>${esc(service)}</code> from the <code>${esc(info.branch)}</code> worktree. <a href="${esc(env.INDEX_URL)}">All checks</a>.`;
    more = card(
      "ready check",
      rows([
        ["check", `<span class="dl-ok">${esc(check)}</span>`],
        ["why", esc(about)],
        ["Host", esc(req.headers.host)],
        ["accepts", allowedHost ? esc(allowedHost) : "any Host"],
      ]),
    );
  }

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(service)}, lane ${info.lane} of ${esc(info.project)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap">
<link rel="stylesheet" href="/devlanes.css">
</head>
<body>
<div class="dl-page">
<header class="dl-header">
  <a class="dl-brand" href="${esc(env.INDEX_URL ?? "/")}"><img src="/logo.svg" alt="" width="32" height="32">devlanes</a>
  <nav class="dl-nav"><a href="https://github.com/devlanes-run/examples/tree/main/basics-ready-checks">basics-ready-checks on GitHub</a></nav>
</header>
<main class="dl-main">
  <h1 class="dl-title">This is lane ${info.lane} of ${esc(info.project)}.</h1>
  <p class="dl-lede">${lede}</p>
  ${laneCard}
  ${more}
</main>
</div>
</body>
</html>`;
}

const server = createServer((req, res) => {
  if (!hostAllowed(req.headers.host)) {
    console.log(`rejected Host ${req.headers.host} for ${req.url}`);
    res.writeHead(400, { "content-type": "text/plain" });
    return res.end(`invalid host ${req.headers.host}: this app answers only on ${allowedHost}\n`);
  }
  const path = new URL(req.url, "http://x").pathname;
  if (path === "/healthz") {
    res.writeHead(200, { "content-type": "text/plain" });
    return res.end("ok");
  }
  if (path === "/lane") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(laneInfo(req)));
  }
  if (files[path]) {
    res.writeHead(200, { "content-type": files[path][0] });
    return res.end(files[path][1]);
  }
  if (path === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end(page(req));
  }
  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found\n");
});

if (startDelay) console.log(`waiting ${startDelay} ms before listening`);
setTimeout(() => {
  server.listen(port, host, () => console.log(`listening on http://${host}:${port}`));
}, startDelay);
