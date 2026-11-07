import http from 'node:http';
import https from 'node:https';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const mode = process.env.MODE ?? 'index';
const port = Number(process.env.PORT);
const host = process.env.HOST ?? '127.0.0.1';
const domain = process.env.LANE_DOMAIN ?? 'broken.localhost';
const laneIndex = Number(process.env.DEVLANES_LANE ?? 0);

const css = readFileSync(join(import.meta.dirname, 'devlanes.css'));
const logo = readFileSync(join(import.meta.dirname, 'logo.svg'));

// Full unit references, so the commands work from any folder and for extra lanes of one folder.
const unit = (service) => `${process.env.DEVLANES_LANE_PROJECT}@${laneIndex}:${service}`;

const failures = [
  {
    service: 'crash',
    url: `https://crash.${domain}`,
    shows: 'Exits 1 on boot. The start fails, the unit stays failed and is not restarted, and the hostname answers DL203 service-failed with the end of its output.',
    command: `devlanes start ${unit('crash')}`,
  },
  {
    service: 'fragile',
    url: `https://fragile.${domain}/crash`,
    shows: 'A healthy server whose /crash route kills the process a second later. The next request gets DL203.',
    command: `devlanes start ${unit('fragile')}`,
  },
  {
    service: 'fragile',
    url: `https://fragile.${domain}/reset`,
    shows: 'Destroys the socket without answering: DL302 upstream-failed.',
    command: `devlanes start ${unit('fragile')}`,
  },
  {
    service: 'fragile',
    url: `https://fragile.${domain}/upgrade`,
    shows: 'Answers a plain GET with 101 Switching Protocols: DL303 unexpected-upgrade.',
    command: `devlanes start ${unit('fragile')}`,
  },
  {
    service: 'fragile',
    url: `https://fragile.${domain}`,
    shows: 'Before fragile starts, or after devlanes stop fragile: DL201 service-idle.',
    command: `devlanes stop ${unit('fragile')}`,
  },
  {
    service: 'missing',
    url: `https://missing.${domain}`,
    shows: 'Its run names a program that is not installed. The start fails with "command not found on PATH".',
    command: `devlanes start ${unit('missing')}`,
  },
  {
    service: 'wrongport',
    url: `https://wrongport.${domain}`,
    shows: 'Listens on a port of its own choosing with ready: started, so it counts as ready: DL301 upstream-unreachable.',
    command: `devlanes start ${unit('wrongport')}`,
  },
  {
    service: 'neverready',
    url: `https://neverready.${domain}`,
    shows: 'Its /healthz never passes. Requests wait 30 seconds and get DL202 service-starting; after the 45 second ready timeout, DL203.',
    command: `devlanes start ${unit('neverready')}`,
  },
  {
    service: 'loop',
    url: `https://loop.${domain}`,
    shows: 'Proxies every request to its own public URL and keeps the Host header: DL104 proxy-loop.',
    command: `devlanes start ${unit('loop')}`,
  },
  {
    service: '(none)',
    url: `http://nothing.${domain}`,
    shows: 'No lane routes the hostname: DL101 unknown-host. Use http://, since HTTPS fails on the certificate first.',
    command: `curl http://nothing.${domain}/`,
  },
  {
    service: '(config)',
    url: null,
    shows: 'devlanes.broken.yaml has a typo in a key. config check points at the line.',
    command: 'devlanes --file devlanes.broken.yaml config check',
  },
];

function lane(req) {
  return {
    project: process.env.DEVLANES_LANE_PROJECT,
    lane: laneIndex,
    lane_name: process.env.DEVLANES_LANE_NAME,
    branch: process.env.LANE_LABEL,
    service: process.env.DEVLANES_SERVICE,
    port,
    url: req.headers['x-forwarded-host'] ? `https://${req.headers['x-forwarded-host']}` : null,
  };
}

function escape(text) {
  return String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

function page(req) {
  const info = lane(req);
  const rows = failures
    .map((f) => {
      const link = f.url ? `<a href="${escape(f.url)}">${escape(f.url)}</a><br>` : '';
      return `<dt class="dl-key">${escape(f.service)}</dt><dd>${link}${escape(f.shows)}<br><span class="dl-ok">$ ${escape(f.command)}</span></dd>`;
    })
    .join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>broken, lane ${info.lane}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap">
<link rel="stylesheet" href="/devlanes.css">
</head>
<body>
<div class="dl-page">
  <header class="dl-header">
    <a class="dl-brand" href="/"><img src="/logo.svg" alt="">devlanes</a>
    <nav class="dl-nav"><a href="https://github.com/devlanes-run/examples/tree/main/showcase-broken">showcase-broken on GitHub</a></nav>
  </header>
  <main class="dl-main">
    <h1 class="dl-title">This is lane ${info.lane} of broken.</h1>
    <p class="dl-lede">The <code>${escape(info.service)}</code> service is healthy. Every other service in this lane is built to fail; start one by name to see its failure in the CLI, the TUI and the proxy's error page.</p>
    <div class="dl-card" style="--dl-lane: var(--dl-lane-${laneIndex % 4})">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>lane</span><span></span></div>
      <dl class="dl-rows">
        <dt>lane</dt><dd>${info.lane} (${escape(info.lane_name)})</dd>
        <dt>branch</dt><dd>${escape(info.branch)}</dd>
        <dt>service</dt><dd>${escape(info.service)}</dd>
        <dt>port</dt><dd>${info.port}</dd>
        <dt>url</dt><dd class="dl-url">${escape(info.url)}</dd>
      </dl>
    </div>
    <h2 class="dl-h2">Broken on purpose</h2>
    <div class="dl-card" style="--dl-lane: var(--dl-lane-${laneIndex % 4})">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>failures</span><span></span></div>
      <dl class="dl-rows">
${rows}
      </dl>
    </div>
  </main>
  <footer class="dl-footer">devlanes examples</footer>
</div>
</body>
</html>
`;
}

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body, null, 2) + '\n');
}

function text(res, status, body) {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
  res.end(body + '\n');
}

// Routes every mode shares; returns true when it answered.
function common(req, res) {
  const path = new URL(req.url, 'http://x').pathname;
  if (path === '/lane') return json(res, 200, lane(req)), true;
  if (path === '/devlanes.css') return res.writeHead(200, { 'content-type': 'text/css' }), res.end(css), true;
  if (path === '/logo.svg') return res.writeHead(200, { 'content-type': 'image/svg+xml' }), res.end(logo), true;
  if (path === '/healthz' && mode !== 'neverready') return text(res, 200, 'ok'), true;
  return false;
}

const handlers = {
  index(req, res) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(page(req));
  },

  fragile(req, res) {
    const path = new URL(req.url, 'http://x').pathname;
    if (path === '/crash') {
      text(res, 200, 'fragile exits in 1 second');
      setTimeout(() => {
        throw new Error('crash requested through /crash');
      }, 1000);
    } else if (path === '/reset') {
      console.log('/reset: destroying the socket without an answer');
      req.socket.destroy();
    } else if (path === '/upgrade') {
      // Written by hand because node:http only sends 101 for requests that asked to upgrade.
      console.log('/upgrade: answering a plain GET with 101');
      req.socket.end('HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: acme\r\n\r\n');
    } else {
      json(res, 200, { ...lane(req), routes: ['/crash', '/reset', '/upgrade'] });
    }
  },

  neverready(req, res) {
    text(res, 503, 'not ready: waiting for a database that never comes up');
  },

  loop(req, res) {
    // Sends the request back through the devlanes proxy with the original Host,
    // the mistake a dev server proxy without changeOrigin makes.
    const upstream = https.request(new URL(req.url, process.env.PUBLIC_URL), {
      method: req.method,
      headers: req.headers,
    });
    upstream.on('response', (answer) => {
      res.writeHead(answer.statusCode, answer.headers);
      answer.pipe(res);
    });
    upstream.on('error', (error) => text(res, 502, `loop: ${error.message}`));
    req.pipe(upstream);
  },

  wrongport: (req, res) => text(res, 200, 'wrongport answered'),
};

if (mode === 'crash') {
  console.error('crash: ACME_API_KEY is not set, refusing to boot');
  // Leaving through exitCode instead of process.exit() lets the message reach the log first.
  process.exitCode = 1;
} else if (handlers[mode]) {
  const server = http.createServer((req, res) => {
    if (!common(req, res)) handlers[mode](req, res);
  });
  // wrongport ignores PORT and lets the OS pick, like a server with its own port setting.
  server.listen(mode === 'wrongport' ? 0 : port, host, () => {
    console.log(`${mode} listening on http://${host}:${server.address().port}`);
  });
} else {
  console.error(`unknown MODE ${mode}`);
  process.exitCode = 1;
}
