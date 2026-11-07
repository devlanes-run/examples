import { setTimeout as sleep } from "node:timers/promises";
import { connectQueue, type Job, type Queue } from "@queue-workers/queue";
import { env } from "./env.js";

const name = `worker.${env.workerId}`;
// An empty queue blocks a claim this long, which bounds how long a stop waits with no job in flight.
const CLAIM_TIMEOUT_S = 1;

let inFlight: Job | null = null;

/** Connects to this lane's queue, takes back jobs a killed run left behind and reports idle. */
async function connect(): Promise<Queue> {
  const queue = await connectQueue({ url: env.redisUrl, prefix: env.queuePrefix });
  for (const job of await queue.recover(name)) {
    console.log(`${name} put job ${job.id} back on the queue, left by a killed run`);
  }
  await queue.report(name, "idle", null);
  return queue;
}

/** Returns a signal that aborts on SIGINT or SIGTERM. The loop checks it between jobs. */
function onShutdown(): AbortSignal {
  const controller = new AbortController();
  const stop = (signal: NodeJS.Signals) => {
    if (controller.signal.aborted) return;
    console.log(
      inFlight
        ? `${name} got ${signal}, finishing job ${inFlight.id} first`
        : `${name} got ${signal}, no job in flight`,
    );
    controller.abort();
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  return controller.signal;
}

/** Takes jobs one at a time until `stopping` aborts. */
async function work(queue: Queue, stopping: AbortSignal): Promise<void> {
  while (!stopping.aborted) {
    const claim = await queue.claim(name, CLAIM_TIMEOUT_S);
    if (!claim) continue;
    inFlight = claim.job;
    await queue.report(name, "busy", claim.job);
    console.log(`${name} started job ${claim.job.id}`);
    const startedAt = Date.now();
    // Stands in for the real work: each job says how long it takes.
    await sleep(claim.job.ms);
    const finished = await queue.finish(name, claim, startedAt);
    console.log(`${name} finished job ${finished.id} in ${finished.took_ms} ms`);
    inFlight = null;
    await queue.report(name, "idle", null);
  }
}

/** Reports the worker stopped and closes the connection. Waiting jobs stay for the next start. */
async function shutdown(queue: Queue): Promise<void> {
  await queue.report(name, "stopped", null);
  await queue.close();
  console.log(`${name} stopped cleanly, ${queue.prefix} keeps the waiting jobs for the next start`);
}

const queue = await connect();
const stopping = onShutdown();
// devlanes.yaml waits for this line: ready.log is "worker ${{ replica.index }} ready".
console.log(`worker ${env.workerId} ready, waiting on ${queue.keys.waiting}`);
await work(queue, stopping);
await shutdown(queue);
