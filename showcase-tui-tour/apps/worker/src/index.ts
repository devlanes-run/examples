import nodemailer from "nodemailer";
import { createClient } from "redis";
import { env } from "./env.js";
import { deliver, type MailJob } from "./mail.js";

// The API pushes onto QUEUE and reads DONE (apps/api/src/mail.ts).
const QUEUE = "mail:queue";
const DONE = "mail:done";
const KEEP_DONE = 20;
const TIMEOUT_MS = 5_000;

type Connections = Awaited<ReturnType<typeof connect>>;

let stopping = false;

const log = (level: string, line: string) =>
  console.log(`${new Date().toTimeString().slice(0, 8)} ${level} ${line}`);

/** Opens the Redis connections and checks that the lane's Mailpit accepts SMTP. */
async function connect() {
  const redis = createClient({ url: env.redisUrl, socket: { connectTimeout: TIMEOUT_MS } });
  redis.on("error", (err: Error) => log("ERROR", `redis: ${err.message}`));
  await redis.connect();
  // BRPOP blocks its connection, so the writes go through a second one.
  const queue = redis.duplicate();
  queue.on("error", (err: Error) => log("ERROR", `redis: ${err.message}`));
  await queue.connect();

  const mail = nodemailer.createTransport({
    url: env.smtpUrl,
    connectionTimeout: TIMEOUT_MS,
    greetingTimeout: TIMEOUT_MS,
    socketTimeout: TIMEOUT_MS,
  });
  await mail.verify();
  console.log(`connected to redis (db ${env.redisIndex}) and smtp (${env.smtpHost})`);
  return { redis, queue, mail };
}

/** Sends one job and records it on DONE; a failed send is logged and the loop goes on. */
async function handle(conn: Connections, job: MailJob): Promise<void> {
  try {
    const sent = await deliver(conn.mail, job);
    await conn.redis
      .multi()
      .lPush(DONE, JSON.stringify(sent))
      .lTrim(DONE, 0, KEEP_DONE - 1)
      .exec();
    log("INFO", `job done queue=${QUEUE} id=${job.id} to=${job.to} took=${sent.took_ms}ms`);
  } catch (err) {
    log("ERROR", `job failed queue=${QUEUE} id=${job.id}: ${(err as Error).message}`);
  }
}

/** Takes jobs off the queue one at a time until the worker shuts down. */
async function work(conn: Connections): Promise<void> {
  while (!stopping) {
    // Blocks without using CPU until a job arrives, so an idle lane can freeze.
    const item = await conn.queue.brPop(QUEUE, 0).catch((err: unknown) => {
      if (stopping) return null;
      throw err;
    });
    if (item) await handle(conn, JSON.parse(item.element) as MailJob);
  }
}

/** Closes the connections when devlanes stops the worker, which ends the blocked BRPOP. */
function closeOnSignal(conn: Connections): void {
  const shutdown = (signal: NodeJS.Signals) => {
    stopping = true;
    console.log(`${signal}: closing connections`);
    conn.queue.destroy();
    conn.mail.close();
    void conn.redis.close();
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

const conn = await connect();
closeOnSignal(conn);
// The ready check in devlanes.yaml waits for this line.
console.log(`worker ready: waiting for jobs on ${QUEUE}`);
await work(conn);
