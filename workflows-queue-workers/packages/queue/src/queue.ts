import { createClient } from "redis";
import { queueKeys, type QueueKeys } from "./keys.js";
import type { Claim, FinishedJob, Job, QueueState, WorkerState, WorkerStatus } from "./types.js";

// Commands fail after this instead of hanging when Redis stops answering. A claim blocks for at
// most a few seconds, which fits inside it.
const TIMEOUT_MS = 5_000;
const JOB_MS = 2_000;
const KEEP_FINISHED = 100;
const LIST_FINISHED = 50;

function createRedis(url: string) {
  return createClient({
    url,
    socket: { connectTimeout: TIMEOUT_MS },
    commandOptions: { timeout: TIMEOUT_MS },
  });
}

type Redis = ReturnType<typeof createRedis>;

/** Where the queue lives: the Redis URL and the key prefix of this lane. */
export type QueueOptions = {
  url: string;
  prefix: string;
};

/** Connects to Redis and returns the queue under `prefix`. */
export async function connectQueue({ url, prefix }: QueueOptions): Promise<Queue> {
  const redis = createRedis(url);
  redis.on("error", (err: Error) => console.error(`redis: ${err.message}`));
  await redis.connect();
  return new Queue(redis, prefix);
}

/** One lane's job queue on a shared Redis. Every key starts with the lane's prefix. */
export class Queue {
  readonly prefix: string;
  readonly keys: QueueKeys;
  readonly #redis: Redis;

  constructor(redis: Redis, prefix: string) {
    this.#redis = redis;
    this.prefix = prefix;
    this.keys = queueKeys(prefix);
  }

  /** Adds `count` jobs and returns their ids. */
  async enqueue(count: number): Promise<number[]> {
    const last = await this.#redis.incrBy(this.keys.nextId, count);
    const now = Date.now();
    const jobs: Job[] = Array.from({ length: count }, (_, i) => ({
      id: last - count + 1 + i,
      ms: JOB_MS,
      enqueued_at: now,
    }));
    // LPUSH plus a claim from the right keeps the jobs in order.
    await this.#redis.lPush(
      this.keys.waiting,
      jobs.map((job) => JSON.stringify(job)),
    );
    return jobs.map((job) => job.id);
  }

  /** Moves the oldest waiting job to `worker`'s active list, or waits up to `timeoutS` for one. */
  async claim(worker: string, timeoutS: number): Promise<Claim | null> {
    const raw = await this.#redis.blMove(
      this.keys.waiting,
      this.keys.active(worker),
      "RIGHT",
      "LEFT",
      timeoutS,
    );
    return raw === null ? null : { job: JSON.parse(raw) as Job, raw };
  }

  /** Puts jobs a killed `worker` left in its active list back at the front of the queue. */
  async recover(worker: string): Promise<Job[]> {
    const jobs: Job[] = [];
    for (;;) {
      const raw = await this.#redis.lMove(
        this.keys.active(worker),
        this.keys.waiting,
        "RIGHT",
        "RIGHT",
      );
      if (raw === null) return jobs;
      jobs.push(JSON.parse(raw) as Job);
    }
  }

  /** Records a claimed job as finished by `worker` and drops it from the active list. */
  async finish(worker: string, claim: Claim, startedAt: number): Promise<FinishedJob> {
    const now = Date.now();
    const finished: FinishedJob = {
      ...claim.job,
      worker,
      pid: process.pid,
      took_ms: now - startedAt,
      finished_at: now,
    };
    await this.#redis
      .multi()
      .lPush(this.keys.done, JSON.stringify(finished))
      .lTrim(this.keys.done, 0, KEEP_FINISHED - 1)
      .lRem(this.keys.active(worker), 1, claim.raw)
      .exec();
    return finished;
  }

  /** Stores what `worker` is doing, for the api's page. */
  async report(worker: string, state: WorkerState, job: Job | null): Promise<void> {
    const status: WorkerStatus = { state, job: job?.id ?? null, pid: process.pid, at: Date.now() };
    await this.#redis.hSet(this.keys.workers, worker, JSON.stringify(status));
  }

  /** The waiting count, every worker's last report and the newest finished jobs. */
  async list(): Promise<QueueState> {
    const [waiting, done, workers] = await Promise.all([
      this.#redis.lLen(this.keys.waiting),
      this.#redis.lRange(this.keys.done, 0, LIST_FINISHED - 1),
      this.#redis.hGetAll(this.keys.workers),
    ]);
    return {
      prefix: this.prefix,
      waiting,
      workers: Object.fromEntries(
        Object.entries(workers)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([name, raw]) => [name, JSON.parse(raw) as WorkerStatus]),
      ),
      finished: done.map((raw) => JSON.parse(raw) as FinishedJob),
    };
  }

  /** Deletes the finished-job records and returns how many there were. Waiting jobs stay. */
  async cleanup(): Promise<number> {
    const [removed] = await this.#redis.multi().lLen(this.keys.done).del(this.keys.done).exec();
    return Number(removed);
  }

  /** Closes the connection once pending commands have answered. */
  async close(): Promise<void> {
    await this.#redis.close();
  }
}
