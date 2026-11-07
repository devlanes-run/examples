import { createServer } from "node:http";
import { laneInfo, listen, sendAsset, sendJson, sendText } from "./lane.mjs";

const env = process.env;
const folder = "https://github.com/devlanes-run/examples/tree/main/agents-plugin-hooks";

const escape = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

async function fetchTasks() {
  try {
    const res = await fetch(`${env.API_URL}/api/tasks`);
    if (!res.ok) return { error: `${res.status} ${res.statusText}` };
    return { tasks: await res.json() };
  } catch (error) {
    return { error: error.cause?.code ?? error.message };
  }
}

function page(info, api) {
  const url = info.url
    ? `<a href="${escape(info.url)}">${escape(info.url)}</a>`
    : `<span class="dl-bad">not through the proxy</span>`;
  const tasks = api.error
    ? `<dt>error</dt><dd class="dl-bad">${escape(api.error)}</dd>`
    : api.tasks
        .map((t) => `<dt>${t.done ? `<span class="dl-ok">done</span>` : "todo"}</dt><dd>${escape(t.title)}</dd>`)
        .join("");
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
    <nav class="dl-nav"><a href="${folder}">agents-plugin-hooks on GitHub</a></nav>
  </header>
  <main class="dl-main">
    <h1 class="dl-title">This is lane ${escape(info.lane)} of <span style="white-space: nowrap">${escape(info.project)}.</span></h1>
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
    <h2 class="dl-h2">The api of this lane</h2>
    <p class="dl-lede">This page fetched <code>/api/tasks</code> from <code>${escape(env.API_URL)}</code>, the api's <code>url</code> in this lane.</p>
    <div class="dl-card">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>GET /api/tasks</span><span></span></div>
      <dl class="dl-rows">${tasks}</dl>
    </div>
    <h2 class="dl-h2">Set up for coding agents</h2>
    <p class="dl-lede">An agent working in this folder reads the devlanes rules from <code>AGENTS.md</code>, and Claude Code runs the devlanes hook before every shell command.</p>
    <div class="dl-card">
      <dl class="dl-rows">
        <dt>AGENTS.md</dt><dd><a href="${folder}/AGENTS.md">the devlanes section of the agent plugin</a></dd>
        <dt>CLAUDE.md</dt><dd>imports AGENTS.md for Claude Code</dd>
        <dt>.claude/settings.json</dt><dd>the plugin's PreToolUse hook</dd>
        <dt>npm test</dt><dd>run it with <code>devlanes with -- npm test</code></dd>
      </dl>
    </div>
  </main>
  <footer class="dl-footer">web.mjs and api.mjs, node:http, no dependencies</footer>
</div>
</body>
</html>
`;
}

const server = createServer(async (req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;

  if (path === "/healthz") return sendText(res, 200, "ok");
  if (path === "/lane") return sendJson(res, laneInfo(req));
  if (sendAsset(res, path)) return;
  if (path === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end(page(laneInfo(req), await fetchTasks()));
  }
  sendText(res, 404, "not found\n");
});

listen(server);
