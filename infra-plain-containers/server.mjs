import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import * as oidc from "openid-client";

const env = process.env;
const issuer = new URL(env.OIDC_ISSUER);
const redirectUri = new URL("/callback", env.PUBLIC_URL).href;
// The mock provider accepts any client id and secret.
const clientId = "acme-web";
const clientSecret = "acme-secret";
const sessions = new Map();
let config;

const assets = {
  "/devlanes.css": ["text/css", readFileSync(new URL("devlanes.css", import.meta.url))],
  "/logo.svg": ["image/svg+xml", readFileSync(new URL("logo.svg", import.meta.url))],
};

// Discovery, and later the token request, go over HTTPS to auth.<lane domain>
// (trusted through NODE_EXTRA_CA_CERTS). Calling the container on 127.0.0.1
// would make the provider answer with an http://127.0.0.1 issuer, and the ID
// token's iss would no longer match the one the browser logged in at.
async function discover() {
  config ??= await oidc.discovery(issuer, clientId, clientSecret);
  return config;
}

function laneInfo(req) {
  const forwarded = req.headers["x-forwarded-host"];
  return {
    project: env.DEVLANES_LANE_PROJECT,
    lane: Number(env.DEVLANES_LANE),
    lane_name: env.DEVLANES_LANE_NAME,
    branch: env.LANE_LABEL,
    service: env.DEVLANES_SERVICE,
    port: Number(env.PORT),
    url: forwarded ? `https://${forwarded}` : `http://${req.headers.host}`,
    oidc_issuer: env.OIDC_ISSUER,
    oidc_port: Number(env.OIDC_PORT),
    whoami_url: env.WHOAMI_URL,
  };
}

async function whoami() {
  const res = await fetch(`${env.WHOAMI_URL}/api`);
  if (!res.ok) throw new Error(`whoami answered ${res.status}`);
  return res.json();
}

const sidOf = (req) => /(?:^|;\s*)sid=([0-9a-f]+)/.exec(req.headers.cookie ?? "")?.[1];
const sessionOf = (req) => sessions.get(sidOf(req));

const escape = (s) =>
  String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function card(title, body) {
  return `<div class="dl-card">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>${escape(title)}</span><span></span></div>
      ${body}
    </div>`;
}

function rows(entries) {
  return `<dl class="dl-rows">${entries.map(([k, v]) => `<dt>${escape(k)}</dt><dd>${v}</dd>`).join("")}</dl>`;
}

function page(info, { session, provider, shared }) {
  const login = session?.claims
    ? card("ID token claims", `<pre>${escape(JSON.stringify(session.claims, null, 2))}</pre>`) +
      `<p><a class="dl-button" href="/logout">Log out</a></p>`
    : `<p><a class="dl-button" href="/login">Log in at auth.${escape(env.LANE_DOMAIN)}</a></p>`;
  const providerRows = provider.error
    ? `<pre class="dl-bad">${escape(provider.error)}</pre>`
    : rows([
        ["issuer", `<span class="dl-ok">${escape(provider.issuer)}</span>`],
        ["authorize", escape(provider.authorize)],
        ["token", escape(provider.token)],
        ["host port", escape(info.oidc_port)],
      ]);
  const sharedRows = shared.error
    ? `<pre class="dl-bad">${escape(shared.error)}</pre>`
    : rows([
        ["url", escape(info.whoami_url)],
        ["hostname", `<span class="dl-key">${escape(shared.hostname)}</span>`],
      ]);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(info.project)} lane ${info.lane}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap">
<link rel="stylesheet" href="/devlanes.css">
</head>
<body style="--dl-lane: var(--dl-lane-${info.lane % 4})">
<div class="dl-page">
  <header class="dl-header">
    <a class="dl-brand" href="/"><img src="/logo.svg" alt="">devlanes</a>
    <nav class="dl-nav"><a href="https://github.com/devlanes-run/examples/tree/main/infra-plain-containers">infra-plain-containers on GitHub</a></nav>
  </header>
  <main class="dl-main">
    <h1 class="dl-title">This is lane ${info.lane} of ${escape(info.project)}.</h1>
    <p class="dl-lede">The ${escape(info.service)} service of the <code>${escape(info.branch)}</code> worktree. It logs in against this lane's own OIDC provider container and reads from a whoami container that every lane shares.</p>
    ${card("GET /lane", rows([
      ["lane", `${info.lane} (${escape(info.lane_name)})`],
      ["branch", escape(info.branch)],
      ["service", escape(info.service)],
      ["port", info.port],
      ["url", `<a href="${escape(info.url)}">${escape(info.url)}</a>`],
    ]))}
    <h2 class="dl-h2">Login</h2>
    ${login}
    <h2 class="dl-h2">OIDC provider, this lane only</h2>
    ${card("infra.containers.oidc", providerRows)}
    <h2 class="dl-h2">whoami, shared by every lane</h2>
    ${card("infra.containers.whoami", sharedRows)}
  </main>
  <footer class="dl-footer"><a href="/lane">/lane</a> | <a href="/healthz">/healthz</a> | <a href="${escape(env.OIDC_ISSUER)}/.well-known/openid-configuration">discovery</a></footer>
</div>
</body>
</html>`;
}

function send(res, status, type, body, headers = {}) {
  res.writeHead(status, { "content-type": type, ...headers });
  res.end(body);
}

const json = (res, status, value) =>
  send(res, status, "application/json", JSON.stringify(value, null, 2));

function redirect(res, location, headers = {}) {
  res.writeHead(303, { location, ...headers });
  res.end();
}

createServer(async (req, res) => {
  const url = new URL(req.url, env.PUBLIC_URL);
  try {
    if (req.method !== "GET") return send(res, 405, "text/plain", "method not allowed\n");
    if (assets[url.pathname]) {
      const [type, body] = assets[url.pathname];
      return send(res, 200, type, body);
    }
    if (url.pathname === "/healthz") return send(res, 200, "text/plain", "ok\n");
    if (url.pathname === "/lane") return json(res, 200, laneInfo(req));

    if (url.pathname === "/login") {
      const cfg = await discover();
      const sid = randomBytes(16).toString("hex");
      const login = {
        verifier: oidc.randomPKCECodeVerifier(),
        state: oidc.randomState(),
        nonce: oidc.randomNonce(),
      };
      sessions.set(sid, login);
      const target = oidc.buildAuthorizationUrl(cfg, {
        redirect_uri: redirectUri,
        scope: "openid profile email",
        code_challenge: await oidc.calculatePKCECodeChallenge(login.verifier),
        code_challenge_method: "S256",
        state: login.state,
        nonce: login.nonce,
      });
      return redirect(res, target.href, {
        "set-cookie": `sid=${sid}; Path=/; HttpOnly; Secure; SameSite=Lax`,
      });
    }

    if (url.pathname === "/callback") {
      const session = sessionOf(req);
      if (!session?.verifier) return send(res, 400, "text/plain", "no login in progress\n");
      const tokens = await oidc.authorizationCodeGrant(await discover(), url, {
        pkceCodeVerifier: session.verifier,
        expectedState: session.state,
        expectedNonce: session.nonce,
      });
      session.claims = tokens.claims();
      delete session.verifier;
      console.log(`logged in as ${session.claims.sub}, iss ${session.claims.iss}`);
      return redirect(res, "/");
    }

    if (url.pathname === "/logout") {
      sessions.delete(sidOf(req));
      return redirect(res, "/", { "set-cookie": "sid=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax" });
    }

    if (url.pathname === "/") {
      const info = laneInfo(req);
      const [provider, shared] = await Promise.all([
        discover().then(
          (cfg) => {
            const meta = cfg.serverMetadata();
            return { issuer: meta.issuer, authorize: meta.authorization_endpoint, token: meta.token_endpoint };
          },
          (err) => ({ error: err.message }),
        ),
        whoami().then((w) => ({ hostname: w.hostname }), (err) => ({ error: err.message })),
      ]);
      return send(res, 200, "text/html; charset=utf-8", page(info, { session: sessionOf(req), provider, shared }));
    }
    send(res, 404, "text/plain", "not found\n");
  } catch (err) {
    console.error(err);
    json(res, 500, { error: err.message });
  }
}).listen(Number(env.PORT), env.HOST, () => {
  console.log(`web listening on http://${env.HOST}:${env.PORT}, issuer ${env.OIDC_ISSUER}`);
});
