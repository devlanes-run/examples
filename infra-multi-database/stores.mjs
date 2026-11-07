// One entry per datastore: this lane's namespace in it, a health check, and a
// write-then-read of mock data. Connection details come only from the URLs in
// global_env, so the code never knows which lane it runs in.
import { HeadBucketCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient as createClickHouse } from "@clickhouse/client";
import amqp from "amqplib";
import nodemailer from "nodemailer";
import pg from "pg";
import { createClient as createRedis } from "redis";

const env = process.env;
const lane = env.DEVLANES_LANE_NAME ?? "main";
const domain = env.LANE_DOMAIN ?? "localhost";

const pgPool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 4 });
pgPool.on("error", (err) => console.error("postgres:", err.message));

const redis = createRedis({ url: env.REDIS_URL });
redis.on("error", (err) => console.error("redis:", err.message));
redis.connect().catch(() => {});

const clickhouse = createClickHouse({ url: env.CLICKHOUSE_URL });

const s3Url = new URL(env.S3_URL);
const bucket = s3Url.pathname.slice(1);
const s3 = new S3Client({
  endpoint: s3Url.origin,
  region: "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: decodeURIComponent(s3Url.username),
    secretAccessKey: decodeURIComponent(s3Url.password),
  },
});

const mail = nodemailer.createTransport(env.SMTP_URL);
const vhost = decodeURIComponent(new URL(env.AMQP_URL).pathname.slice(1));
const now = () => new Date().toISOString();
const count = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

async function mailpit(path) {
  const res = await fetch(`${env.MAILPIT_URL}${path}`);
  if (!res.ok) throw new Error(`Mailpit answered ${res.status}`);
  return res.json();
}

async function withAmqp(fn) {
  const conn = await amqp.connect(env.AMQP_URL);
  try {
    return await fn(conn);
  } finally {
    await conn.close().catch(() => {});
  }
}

export const stores = [
  {
    key: "postgres",
    title: "Postgres",
    scope: "shared",
    kind: "database",
    namespace: new URL(env.DATABASE_URL).pathname.slice(1),
    envVar: "DATABASE_URL",
    connect: `docker compose -p multi-database exec postgres psql -U postgres ${new URL(env.DATABASE_URL).pathname.slice(1)}`,
    async health() {
      const { rows } = await pgPool.query("SELECT current_database() AS db, current_setting('server_version') AS v");
      return `PostgreSQL ${rows[0].v}, connected to ${rows[0].db}`;
    },
    async tryIt() {
      await pgPool.query("CREATE TABLE IF NOT EXISTS notes (id serial PRIMARY KEY, body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now())");
      const ins = await pgPool.query("INSERT INTO notes (body) VALUES ($1) RETURNING id", [`note from ${lane} at ${now()}`]);
      const { rows } = await pgPool.query("SELECT count(*)::int AS n FROM notes");
      return [`INSERT INTO notes -> id ${ins.rows[0].id}`, `SELECT count(*) FROM notes -> ${rows[0].n}`];
    },
  },
  {
    key: "redis",
    title: "Redis",
    scope: "shared",
    kind: "database index",
    namespace: new URL(env.REDIS_URL).pathname.slice(1),
    envVar: "REDIS_URL",
    connect: `docker compose -p multi-database exec redis redis-cli -n ${new URL(env.REDIS_URL).pathname.slice(1)}`,
    async health() {
      if (!redis.isReady) throw new Error("not connected");
      const [size, owner] = await Promise.all([redis.dbSize(), redis.get("lane:owner")]);
      return `PING ${await redis.ping()}, ${count(size, "key")}, lane:owner = ${owner ?? "(unset)"}`;
    },
    async tryIt() {
      if (!redis.isReady) throw new Error("not connected");
      const n = await redis.incr("clicks");
      await redis.set("last_click", now());
      return [`INCR clicks -> ${n}`, `GET last_click -> ${await redis.get("last_click")}`];
    },
  },
  {
    key: "clickhouse",
    title: "ClickHouse",
    scope: "shared",
    kind: "database",
    namespace: new URL(env.CLICKHOUSE_URL).pathname.slice(1),
    envVar: "CLICKHOUSE_URL",
    console: `https://clickhouse.${domain}/play`,
    async health() {
      const rows = await (await clickhouse.query({ query: "SELECT version() AS v, currentDatabase() AS db", format: "JSONEachRow" })).json();
      return `ClickHouse ${rows[0].v}, connected to ${rows[0].db}`;
    },
    async tryIt() {
      await clickhouse.command({
        query: "CREATE TABLE IF NOT EXISTS events (at DateTime64(3) DEFAULT now64(3), lane String, kind String) ENGINE = MergeTree ORDER BY at",
      });
      await clickhouse.insert({ table: "events", values: [{ lane, kind: "click" }], format: "JSONEachRow" });
      const rows = await (await clickhouse.query({ query: "SELECT count() AS n, toString(max(at)) AS last FROM events", format: "JSONEachRow" })).json();
      return ["INSERT INTO events -> 1 row", `SELECT count() FROM events -> ${rows[0].n}, newest ${rows[0].last}`];
    },
  },
  {
    key: "rabbitmq",
    title: "RabbitMQ",
    scope: "shared",
    kind: "vhost",
    namespace: vhost,
    envVar: "AMQP_URL",
    console: `https://rabbitmq.${domain}/#/queues/${encodeURIComponent(vhost)}`,
    async health() {
      return withAmqp(async (conn) => {
        const props = conn.connection.serverProperties;
        return `RabbitMQ ${props.version}, vhost ${vhost} open`;
      });
    },
    async tryIt() {
      return withAmqp(async (conn) => {
        const ch = await conn.createConfirmChannel();
        await ch.assertQueue("events", { durable: true });
        const body = JSON.stringify({ lane, at: now() });
        ch.sendToQueue("events", Buffer.from(body), { persistent: true });
        await ch.waitForConfirms();
        const msg = await ch.get("events", { noAck: true });
        await ch.close();
        return [`publish events <- ${body}`, `get events -> ${msg ? msg.content.toString() : "(empty)"}`];
      });
    },
  },
  {
    key: "s3",
    title: "S3 (RustFS)",
    scope: "shared",
    kind: "bucket",
    namespace: bucket,
    envVar: "S3_URL",
    console: `https://rustfs.${domain}/rustfs/console/`,
    async health() {
      await s3.send(new HeadBucketCommand({ Bucket: bucket }));
      return `bucket ${bucket} exists`;
    },
    async tryIt() {
      const key = `notes/${now().replace(/[:.]/g, "-")}.txt`;
      await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: `note from ${lane}\n`, ContentType: "text/plain" }));
      const list = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: "notes/" }));
      return [`PUT ${key}`, `LIST notes/ -> ${count(list.KeyCount, "object")}`];
    },
  },
  {
    key: "mailpit",
    title: "Mailpit",
    scope: "per lane",
    kind: "Compose project",
    namespace: `${env.DEVLANES_LANE_PROJECT}-lane${env.DEVLANES_LANE}`,
    envVar: "SMTP_URL",
    console: `https://mail.${domain}`,
    async health() {
      const info = await mailpit("/api/v1/info");
      return `Mailpit ${info.Version}, ${count(info.Messages, "message")} in this lane's inbox`;
    },
    async tryIt() {
      const sent = await mail.sendMail({
        from: "app@example.invalid",
        to: "dev@example.invalid",
        subject: `Hello from ${lane}`,
        text: `Sent by the multi-database example at ${now()}.`,
      });
      const list = await mailpit("/api/v1/messages?limit=1");
      return [`SMTP ${sent.response}`, `GET /api/v1/messages -> ${count(list.total, "message")}, newest "${list.messages[0]?.Subject}"`];
    },
  },
];

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(`no answer in ${ms} ms`)), ms));
}

export async function checkAll() {
  return Promise.all(
    stores.map(async (s) => {
      try {
        return { key: s.key, ok: true, health: await Promise.race([s.health(), timeout(3000)]) };
      } catch (err) {
        return { key: s.key, ok: false, health: err.message || String(err) };
      }
    }),
  );
}
