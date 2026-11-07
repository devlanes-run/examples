// A fake SMS or email provider: `node stub.mjs sms` or `node stub.mjs email`.
import { createServer } from "node:http";
import { card, escape, laneInfo, link, page, readBody, rows, sendHtml, sendJson, serveCommon } from "./page.mjs";

const env = process.env;
const kinds = {
  sms: { name: "SMS", fields: ["to", "body"] },
  email: { name: "email", fields: ["to", "subject", "text"] },
};
const kind = process.argv[2];
if (!kinds[kind]) {
  console.error(`usage: node stub.mjs ${Object.keys(kinds).join("|")}`);
  process.exit(1);
}
const { name, fields } = kinds[kind];

// Kept in memory only, so stopping the stub empties its inbox.
const messages = [];
let nextId = 1;

function receive(input) {
  const missing = fields.filter((field) => typeof input[field] !== "string" || input[field] === "");
  if (missing.length) return { status: 400, body: { error: "invalid_request", message: `missing ${missing.join(", ")}` } };
  const message = { id: `${kind}_${nextId++}`, received_at: new Date().toISOString() };
  for (const field of fields) message[field] = input[field];
  messages.unshift(message);
  messages.length = Math.min(messages.length, 100);
  console.log(`${message.id} to ${message.to}`);
  return { status: 201, body: { ...message, status: "accepted" } };
}

function inbox(req) {
  const info = laneInfo(req);
  const list = messages.length
    ? messages.map((m) => rows([["id", escape(m.id)], ["received", escape(m.received_at)], ...fields.map((f) => [f, escape(m[f])])])).join('<hr class="split">')
    : `<pre>No messages yet. Send one from ${link(env.APP_URL)}.</pre>`;
  return page(info, {
    lede: `The <code>${escape(info.service)}</code> service, a fake ${name} provider, answered from the worktree on <code>${escape(info.branch)}</code>. It keeps what it receives in memory, so the inbox is empty after a restart.`,
    body: `<h2 class="dl-h2">Inbox</h2>
    ${card(`${messages.length} message${messages.length === 1 ? "" : "s"}`, list)}
    <h2 class="dl-h2">Provider API</h2>
    ${card("POST /v1/messages", rows([
      ["auth", `<code>Authorization: Bearer ${escape(env.API_KEY)}</code>`],
      ["fields", fields.map((f) => `<span class="dl-key">${f}</span>`).join(", ")],
      ["list", `<a href="/v1/messages">GET /v1/messages</a>`],
      ["sender", link(env.APP_URL)],
    ]))}`,
  });
}

const server = createServer(async (req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;
  if (serveCommon(req, res, path)) return;

  if (path === "/v1/messages" && req.method === "POST") {
    if (req.headers.authorization !== `Bearer ${env.API_KEY}`) {
      return sendJson(res, 401, { error: "invalid_api_key", message: "send Authorization: Bearer <key>" });
    }
    let input;
    try {
      input = await readBody(req);
    } catch {
      return sendJson(res, 400, { error: "invalid_request", message: "body is not valid JSON" });
    }
    const result = receive(input);
    return sendJson(res, result.status, result.body);
  }
  if (path === "/v1/messages" && req.method === "GET") return sendJson(res, 200, { messages });
  if (path === "/" && req.method === "GET") return sendHtml(res, 200, inbox(req));

  sendJson(res, 404, { error: "not_found" });
});

server.listen(Number(env.PORT), env.HOST ?? "127.0.0.1", () => {
  console.log(`${kind} stub listening on http://${env.HOST ?? "127.0.0.1"}:${env.PORT}`);
});
