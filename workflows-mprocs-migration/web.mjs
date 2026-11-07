import { createServer } from "node:http";
import { escape, laneInfo, sendJson, sendText, serveAsset } from "./lib.mjs";

const env = process.env;
const port = Number(env.PORT ?? 3000);
const host = env.HOST ?? "127.0.0.1";
// Server-side calls go to the api's loopback address; the page links to the
// hostnames. The defaults are lane 0 of the mprocs setup.
const apiUrl = env.API_URL ?? "http://127.0.0.1:4000";
const apiPublicUrl = env.API_PUBLIC_URL ?? "https://api.acme.localhost";
const smsPublicUrl = env.SMS_PUBLIC_URL ?? "https://sms.acme.localhost";

const link = (url) => `<a href="${escape(url)}">${escape(url)}</a>`;

async function fetchMessages() {
  try {
    const res = await fetch(`${apiUrl}/api/messages`);
    if (!res.ok) return { error: `${apiUrl} answered ${res.status}` };
    return await res.json();
  } catch (err) {
    return { error: `${apiUrl}: ${err.cause?.code ?? err.message}` };
  }
}

function messageRows(result) {
  if (result.error) return `<dt>api</dt><dd class="dl-bad">${escape(result.error)}</dd>`;
  if (!result.messages.length) return `<dt>none</dt><dd>run <code>devlanes run seed</code></dd>`;
  return result.messages
    .map((m) => {
      const status =
        m.status === "sent"
          ? `<span class="dl-ok">sent</span>`
          : `<span class="dl-bad">queued</span>`;
      return `<dt>${escape(m.id)}</dt><dd>${status} ${escape(m.to)}: ${escape(m.body)}</dd>`;
    })
    .join("\n        ");
}

function page(info, result) {
  const lane = info.lane ?? "?";
  const title =
    info.lane === null
      ? "Running outside devlanes."
      : `This is lane ${escape(lane)} of <span style="white-space: nowrap">${escape(info.project)}.</span>`;
  const url = info.url ? link(info.url) : `<span class="dl-bad">not through a proxy</span>`;
  const queued = result.messages?.filter((m) => m.status === "queued").length ?? 0;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lane ${escape(lane)} of ${escape(info.project)}</title>
<link rel="icon" href="/logo.svg">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap">
<link rel="stylesheet" href="/devlanes.css">
</head>
<body style="--dl-lane: var(--dl-lane-${Number(info.lane ?? 0) % 4})">
<div class="dl-page">
  <header class="dl-header">
    <a class="dl-brand" href="https://devlanes.run"><img src="/logo.svg" alt="" width="32" height="32">devlanes</a>
    <nav class="dl-nav"><a href="https://github.com/devlanes-run/examples/tree/main/workflows-mprocs-migration">workflows-mprocs-migration on GitHub</a></nav>
  </header>
  <main class="dl-main">
    <h1 class="dl-title">${title}</h1>
    <p class="dl-lede">The <code>${escape(info.service ?? "web")}</code> service answered from the worktree on <code>${escape(info.branch)}</code>.</p>
    <div class="dl-card">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>${escape(info.project)}@${escape(lane)}:${escape(info.service)}</span><span></span></div>
      <dl class="dl-rows">
        <dt>lane</dt><dd>${escape(lane)} <span class="dl-key">${escape(info.lane_name)}</span></dd>
        <dt>branch</dt><dd>${escape(info.branch)}</dd>
        <dt>service</dt><dd>${escape(info.service)}</dd>
        <dt>port</dt><dd>${escape(info.port)}</dd>
        <dt>url</dt><dd>${url}</dd>
      </dl>
    </div>
    <h2 class="dl-h2">Messages</h2>
    <p class="dl-lede">The api keeps them, the worker sends the queued ones through the SMS stub. ${queued ? `${queued} queued: start the stub with <code>devlanes start sms-stub</code>.` : ""}</p>
    <div class="dl-card">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>GET ${escape(apiUrl)}/api/messages</span><span></span></div>
      <dl class="dl-rows">
        ${messageRows(result)}
      </dl>
    </div>
    <h2 class="dl-h2">Before and after</h2>
    <p class="dl-lede">Under mprocs, Caddy routed fixed names to fixed ports and <code>scripts/slot.sh</code> moved them for other worktrees. Here each lane gets its own.</p>
    <div class="dl-card">
      <dl class="dl-rows">
        <dt>web</dt><dd>https://acme.localhost -&gt; ${url}</dd>
        <dt>api</dt><dd>https://api.acme.localhost -&gt; ${link(apiPublicUrl)}</dd>
        <dt>sms-stub</dt><dd>https://sms.acme.localhost -&gt; ${link(smsPublicUrl)}</dd>
        <dt>web port</dt><dd>3000 + 100 &times; slot -&gt; ${escape(info.port)}</dd>
      </dl>
    </div>
  </main>
  <footer class="dl-footer">web.mjs, node:http, no dependencies</footer>
</div>
</body>
</html>
`;
}

const server = createServer(async (req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;
  if (path === "/healthz") return sendText(res, 200, "ok");
  if (path === "/lane") return sendJson(res, 200, laneInfo(req, port));
  if (serveAsset(res, path)) return;
  if (path === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end(page(laneInfo(req, port), await fetchMessages()));
  }
  sendText(res, 404, "not found\n");
});

server.listen(port, host, () => {
  console.log(`web listening on http://${host}:${port}`);
});
