import { randomUUID } from "node:crypto";
import { redisEnv, serverEnv } from "./env.js";
import { redis } from "./redis.js";

// The worker takes jobs off QUEUE and pushes what it sent onto DONE (apps/worker/src/index.ts).
const QUEUE = "mail:queue";
const DONE = "mail:done";

/** A mail waiting for the worker. The worker reads the same fields. */
export type MailJob = {
  id: string;
  to: string;
  subject: string;
  queued_at: string;
};

/** A job the worker has sent, as it stores it on mail:done. */
export type SentMail = MailJob & { sent_at: string; took_ms: number; smtp: string };

/** The lane's Redis index as the page shows it. */
export type MailState = {
  redis_db: number;
  owner: string | null;
  queued: number;
  done: SentMail[];
};

/** The owner the redis setup entry wrote, the queue length and the last ten sent mails. */
export async function mailState(): Promise<MailState> {
  const [owner, queued, done] = await Promise.all([
    redis.get("lane:owner"),
    redis.lLen(QUEUE),
    redis.lRange(DONE, 0, 9),
  ]);
  return {
    redis_db: redisEnv().index,
    owner,
    queued,
    done: done.map((entry) => JSON.parse(entry) as SentMail),
  };
}

/** Puts a mail to `to` on the lane's queue and returns the job. */
export async function queueMail(to: string): Promise<MailJob> {
  const { lane, branch } = serverEnv();
  const job: MailJob = {
    id: randomUUID().slice(0, 8),
    to,
    subject: `Hello from lane ${lane} (${branch})`,
    queued_at: new Date().toISOString(),
  };
  await redis.lPush(QUEUE, JSON.stringify(job));
  return job;
}
