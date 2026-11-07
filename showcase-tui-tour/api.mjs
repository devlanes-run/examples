import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { createClient } from "redis";

const env = process.env;
const database = new URL(env.DATABASE_URL).pathname.slice(1);
const redisDb = new URL(env.REDIS_URL).pathname.slice(1);
// The page on this lane's web hostname calls the API cross-origin; other lanes'
// pages are not in DEVLANES_ORIGINS and get no CORS headers.
const origins = new Set((env.DEVLANES_ORIGINS ?? "").split(",").filter(Boolean));

const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 4 });
// Without a handler, an idle connection that Postgres ends would crash the API.
pool.on("error", (err) => console.error(`pg pool: ${err.message}`));

const redis = createClient({ url: env.REDIS_URL });
redis.on("error", (err) => console.error(`redis: ${err.message}`));

const clock = () => new Date().toTimeString().slice(0, 8);

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
  };
}

async function listOrders() {
  const { rows } = await pool.query(
    "SELECT id, customer, item, total_cents FROM orders ORDER BY id DESC LIMIT 20",
  );
  return rows;
}

async function addOrder({ customer, item, total_cents }) {
  const { rows } = await pool.query(
    "INSERT INTO orders (customer, item, total_cents) VALUES ($1, $2, $3) RETURNING id, customer, item, total_cents",
    [customer, item, total_cents],
  );
  return rows[0];
}

async function mailState() {
  const [owner, queued, done] = await Promise.all([
    redis.get("lane:owner"),
    redis.lLen("mail:queue"),
    redis.lRange("mail:done", 0, 9),
  ]);
  return { redis_db: Number(redisDb), owner, queued, done: done.map((d) => JSON.parse(d)) };
}

async function queueMail(to) {
  const job = {
    id: randomUUID().slice(0, 8),
    to,
    subject: `Hello from lane ${env.DEVLANES_LANE} (${env.LANE_LABEL})`,
    queued_at: new Date().toISOString(),
  };
  await redis.lPush("mail:queue", JSON.stringify(job));
  return job;
}

async function readJson(req) {
  let data = "";
  for await (const chunk of req) data += chunk;
  return data ? JSON.parse(data) : {};
}

function send(res, status, body) {
  const text = typeof body === "string" ? `${body}\n` : JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "content-type": typeof body === "string" ? "text/plain" : "application/json",
  });
  res.end(text);
}

async function route(req, res) {
  const { pathname } = new URL(req.url, "http://localhost");
  const origin = req.headers.origin;
  res.setHeader("vary", "Origin");
  if (origin && origins.has(origin)) res.setHeader("access-control-allow-origin", origin);
  if (req.method === "OPTIONS") {
    if (origin && origins.has(origin)) {
      res.setHeader("access-control-allow-methods", "GET, POST");
      res.setHeader("access-control-allow-headers", "content-type");
    }
    res.writeHead(204);
    return res.end();
  }
  // CSRF: a browser POST must come from one of this lane's origins.
  if (req.method === "POST" && origin && !origins.has(origin)) {
    return send(res, 403, "origin not allowed");
  }

  switch (`${req.method} ${pathname}`) {
    case "GET /healthz":
      return send(res, 200, "ok");
    case "GET /lane":
      return send(res, 200, laneInfo(req));
    case "GET /":
      return send(res, 200, { ...laneInfo(req), database, orders: await listOrders() });
    case "GET /api/orders":
      return send(res, 200, {
        lane: Number(env.DEVLANES_LANE),
        database,
        orders: await listOrders(),
      });
    case "POST /api/orders":
      return send(res, 201, await addOrder(await readJson(req)));
    case "GET /api/mail":
      return send(res, 200, await mailState());
    case "POST /api/mail": {
      const { to } = await readJson(req);
      return send(res, 202, await queueMail(String(to || "dev@example.invalid")));
    }
    default:
      return send(res, 404, { error: `no route for ${req.method} ${pathname}` });
  }
}

const server = createServer(async (req, res) => {
  const started = performance.now();
  try {
    await route(req, res);
  } catch (err) {
    send(res, 500, { error: err.message });
  }
  // The ready check polls /healthz; leave it out of the log.
  if (req.headers["user-agent"] !== "devlanes-ready") {
    const ms = Math.round(performance.now() - started);
    console.log(`${clock()} ${req.method} ${req.url} ${res.statusCode} ${ms}ms`);
  }
});

const { rows } = await pool.query("SELECT current_database() AS db");
console.log(`connected to postgres (${rows[0].db})`);
await redis.connect();
console.log(`connected to redis (db ${redisDb})`);
server.listen(Number(env.PORT), env.HOST, () => {
  console.log(`listening on http://${env.HOST}:${env.PORT}`);
});
