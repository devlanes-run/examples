import { createServer } from "node:http";
import { laneInfo, sendJson, serveCommon } from "./common.mjs";
import { urls } from "./urls.mjs";

const env = process.env;
const origins = (env.DEVLANES_ORIGINS ?? "").split(",");
const flags = (env.FEATURE_FLAGS ?? "").split(",").map((flag) => flag.trim()).filter(Boolean);

const orders = [
  { id: "ord_1001", customer: "ada@example.invalid", total: 42.5 },
  { id: "ord_1002", customer: "grace@example.invalid", total: 18 },
  { id: "ord_1003", customer: "linus@example.invalid", total: 7.25 },
];

function cookie(req, name) {
  for (const part of (req.headers.cookie ?? "").split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return null;
}

// The browser calls /api/session from the web origin with its cookie, so only
// this lane's origins may read the answer.
function cors(req) {
  const origin = req.headers.origin;
  if (!origin || !origins.includes(origin)) return {};
  return { "access-control-allow-origin": origin, "access-control-allow-credentials": "true", vary: "Origin" };
}

const server = createServer((req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;
  if (serveCommon(req, res, path)) return;

  if (path === "/") {
    return sendJson(res, 200, {
      ...laneInfo(req),
      config: {
        app_domain: urls.domain,
        web_url: urls.web,
        api_url: urls.api,
        asset_url: urls.assets,
        cookie_domain: urls.cookieDomain,
        feature_flags: flags,
        sentry: Boolean(env.SENTRY_DSN),
      },
    });
  }
  if (path === "/api/orders") {
    // Both services get ACME_API_TOKEN from the same .env through global_env.
    if (!env.ACME_API_TOKEN || req.headers.authorization !== `Bearer ${env.ACME_API_TOKEN}`) {
      return sendJson(res, 401, { error: "missing or wrong ACME_API_TOKEN" });
    }
    return sendJson(res, 200, { orders });
  }
  if (path === "/api/session") {
    return sendJson(res, 200, { session: cookie(req, "acme_session") }, cors(req));
  }
  sendJson(res, 404, { error: "not found" });
});

server.listen(Number(env.PORT), env.HOST ?? "127.0.0.1", () => {
  console.log(`api listening on http://${env.HOST}:${env.PORT}, api URL ${urls.api}`);
});
