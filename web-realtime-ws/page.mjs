const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

export function renderPage({
  project,
  lane,
  lane_name,
  branch,
  service,
  port,
  url,
  domain,
  ports,
}) {
  const e = escape;
  const card = `class="dl-card" style="--dl-lane: var(--dl-lane-${lane % 4})"`;
  const bar = (title) =>
    `<div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>${title}</span><span></span></div>`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>lane ${lane} of ${e(project)}</title>
  <link rel="icon" href="/logo.svg">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap">
  <link rel="stylesheet" href="/devlanes.css">
  <style>
    .chat { display: flex; gap: 8px; padding: 0 22px 20px; }
    .chat input, .chat select, .chat button { font: inherit; color: var(--dl-term-ink); background: var(--dl-term-raised);
      border: 1px solid rgba(255, 255, 255, .15); border-radius: 5px; padding: 6px 10px; }
    .chat input { flex: 1; min-width: 0; }
    .chat button { cursor: pointer; }
    #log { border-top: 1px solid rgba(255, 255, 255, .07); min-height: 5em; }
  </style>
</head>
<body data-lane="${lane}">
  <div class="dl-page">
    <header class="dl-header">
      <a class="dl-brand" href="/"><img src="/logo.svg" alt="">devlanes</a>
      <nav class="dl-nav"><a href="https://github.com/devlanes-run/examples/tree/main/web-realtime-ws">web-realtime-ws on GitHub</a></nav>
    </header>
    <main class="dl-main">
      <h1 class="dl-title">This is lane ${lane} of <span style="white-space: nowrap">${e(project)}.</span></h1>
      <p class="dl-lede">The <code>${e(service)}</code> service answers from the worktree of <code>${e(branch)}</code>, with one process listening on three ports, each behind its own hostname.</p>

      <div ${card}>
        ${bar("lane")}
        <dl class="dl-rows">
          <dt>lane</dt><dd>${lane} (${e(lane_name)})</dd>
          <dt>branch</dt><dd>${e(branch)}</dd>
          <dt>service</dt><dd>${e(service)}</dd>
          <dt>port</dt><dd>${port}</dd>
          <dt>url</dt><dd class="dl-url">${url ? e(url) : '<span class="dl-bad">no X-Forwarded-Host: not through the proxy</span>'}</dd>
        </dl>
      </div>

      <h2 class="dl-h2">Named ports</h2>
      <div ${card}>
        ${bar("self.ports")}
        <dl class="dl-rows">
          <dt>default</dt><dd>${ports.default} at <a href="https://${e(domain)}">${e(domain)}</a>: this page, /events and /ws</dd>
          <dt>ws</dt><dd>${ports.ws} at wss://ws.${e(domain)}: the chat below</dd>
          <dt>admin</dt><dd>${ports.admin} at <a href="https://admin.${e(domain)}">admin.${e(domain)}</a>: connections and messages as JSON</dd>
        </dl>
      </div>

      <h2 class="dl-h2">Server-Sent Events</h2>
      <div ${card}>
        ${bar("GET /events")}
        <dl class="dl-rows">
          <dt>stream</dt><dd id="sse-state">connecting</dd>
          <dt>last tick</dt><dd id="sse-tick">none yet</dd>
          <dt>received</dt><dd id="sse-age">-</dd>
        </dl>
      </div>

      <h2 class="dl-h2">WebSocket chat</h2>
      <div ${card}>
        ${bar("echo, tagged with the lane")}
        <dl class="dl-rows">
          <dt>ws port</dt><dd id="state-ws">connecting</dd>
          <dt>main port</dt><dd id="state-default">connecting</dd>
        </dl>
        <form class="chat" id="chat">
          <input id="text" autocomplete="off" placeholder="Say something to lane ${lane}">
          <select id="via"><option value="ws">ws.${e(domain)}</option><option value="default">${e(domain)}/ws</option></select>
          <button>Send</button>
        </form>
        <pre id="log"></pre>
      </div>
    </main>
    <footer class="dl-footer">${e(project)}@${lane}</footer>
  </div>
  <script src="/app.js"></script>
</body>
</html>
`;
}
