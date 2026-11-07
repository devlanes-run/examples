import { createServer } from "node:http";
import { card, escape, laneInfo, link, page, readBody, rows, sendHtml, sendJson, serveCommon } from "./page.mjs";

const env = process.env;

// The provider client. Base URLs and keys come from the environment, so the
// same code talks to the stubs here and to the real providers in production.
const providers = {
  sms: { label: "SMS", url: env.SMS_API_URL, key: env.SMS_API_KEY },
  email: { label: "Email", url: env.EMAIL_API_URL, key: env.EMAIL_API_KEY },
};

async function send(kind, message) {
  const provider = providers[kind];
  const target = new URL("/v1/messages", provider.url).href;
  try {
    // HTTPS through the devlanes proxy; Node trusts its CA through NODE_EXTRA_CA_CERTS.
    const res = await fetch(target, {
      method: "POST",
      headers: { authorization: `Bearer ${provider.key}`, "content-type": "application/json" },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(10_000),
    });
    const text = await res.text();
    let body = text;
    try {
      body = JSON.parse(text);
    } catch {
      // The proxy's error pages are Markdown for clients that do not ask for HTML.
    }
    // Set when the devlanes proxy answered instead of the provider, such as service-idle.
    const devlanesError = res.headers.get("x-devlanes-error");
    return { provider: target, status: res.status, ...(devlanesError && { devlanes_error: devlanesError }), body };
  } catch (err) {
    return { provider: target, status: null, error: err.cause?.code ?? err.message };
  }
}

const sent = (result) => result.status >= 200 && result.status < 300;

const examples = {
  sms: { to: "+15550100", body: "Your acme code is 123456" },
  email: { to: "ada@example.invalid", subject: "Welcome to acme", text: "Thanks for signing up." },
};

function input(name, value, label = name) {
  return `<label>${escape(label)}<input name="${escape(name)}" value="${escape(value)}" required></label>`;
}

function resultCard(kind, result) {
  const title = `${providers[kind].label} -> ${result.provider}`;
  if (sent(result)) {
    return card(title, rows([
      ["status", `<span class="dl-ok">${result.status} accepted as ${escape(result.body.id)}</span>`],
      ["inbox", link(providers[kind].url)],
    ]));
  }
  const status = result.status
    ? `${result.status}${result.devlanes_error ? ` <span class="dl-key">x-devlanes-error: ${escape(result.devlanes_error)}</span>` : ""}`
    : escape(result.error);
  const body = result.body === undefined ? "" : typeof result.body === "string" ? result.body : JSON.stringify(result.body, null, 2);
  return card(title, `${rows([["status", `<span class="dl-bad">${status}</span>`]])}${body ? `<pre>${escape(body)}</pre>` : ""}`);
}

function home(req, last) {
  const info = laneInfo(req);
  return page(info, {
    lede: `The <code>${escape(info.service)}</code> service answered from the worktree on <code>${escape(info.branch)}</code>. It sends SMS and email through the provider URLs devlanes gave this lane.`,
    body: `${last ? `<h2 class="dl-h2">Last send</h2>${resultCard(last.kind, last.result)}` : ""}
    <h2 class="dl-h2">Providers</h2>
    ${card("provider client", rows([
      ["SMS_API_URL", link(providers.sms.url)],
      ["EMAIL_API_URL", link(providers.email.url)],
    ]))}
    <h2 class="dl-h2">Send</h2>
    <div class="dl-grid">
      ${card("POST /send/sms", `<form class="dl-form" method="post" action="/send/sms">
        ${input("to", examples.sms.to)}${input("body", examples.sms.body)}
        <button class="dl-button">Send SMS</button></form>`)}
      ${card("POST /send/email", `<form class="dl-form" method="post" action="/send/email">
        ${input("to", examples.email.to)}${input("subject", examples.email.subject)}${input("text", examples.email.text)}
        <button class="dl-button">Send email</button></form>`)}
    </div>`,
  });
}

// Form posts must come from one of this lane's origins.
const origins = new Set((env.DEVLANES_ORIGINS ?? "").split(","));

const server = createServer(async (req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;
  if (serveCommon(req, res, path)) return;

  const route = path.match(/^\/(send|api)\/(sms|email)$/);
  if (route && req.method === "POST") {
    const [, mode, kind] = route;
    if (req.headers.origin && !origins.has(req.headers.origin)) {
      return sendJson(res, 403, { error: "origin_not_allowed", origin: req.headers.origin });
    }
    let message;
    try {
      message = await readBody(req);
    } catch {
      return sendJson(res, 400, { error: "invalid_request", message: "body is not valid JSON" });
    }
    const result = await send(kind, message);
    if (mode === "api") {
      // Keep only the heading and first sentence of a proxy error page; the HTML page shows all of it.
      if (typeof result.body === "string") result.body = result.body.split("\n").slice(0, 3).join("\n");
      return sendJson(res, sent(result) ? 201 : 502, result);
    }
    return sendHtml(res, sent(result) ? 200 : 502, home(req, { kind, result }));
  }
  if (path === "/" && req.method === "GET") return sendHtml(res, 200, home(req));

  sendJson(res, 404, { error: "not_found" });
});

server.listen(Number(env.PORT), env.HOST ?? "127.0.0.1", () => {
  console.log(`api listening on http://${env.HOST ?? "127.0.0.1"}:${env.PORT}`);
});
