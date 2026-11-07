import { setTimeout as sleep } from "node:timers/promises";
import { connect, keys, prefix } from "./queue.mjs";

const name = `worker.${process.env.WORKER_ID}`;
const active = keys.active(name);
const redis = await connect();

let stopping = false;
let job = null;

function stop(signal) {
  if (stopping) return;
  stopping = true;
  console.log(job ? `${name} got ${signal}, finishing job ${job.id} first` : `${name} got ${signal}, no job in flight`);
}
process.on("SIGINT", () => stop("SIGINT"));

async function report(state) {
  const value = { state, job: job?.id ?? null, pid: process.pid, at: Date.now() };
  await redis.hSet(keys.workers, name, JSON.stringify(value));
}

await report("idle");
console.log(`worker ${process.env.WORKER_ID} ready, waiting on ${keys.waiting}`);

while (!stopping) {
  // The 1 second timeout bounds how long a stop waits when no job is in flight.
  const raw = await redis.blMove(keys.waiting, active, "RIGHT", "LEFT", 1);
  if (!raw) continue;
  job = JSON.parse(raw);
  await report("busy");
  console.log(`${name} started job ${job.id}`);
  const started = Date.now();
  await sleep(job.ms);
  const finished = { ...job, worker: name, pid: process.pid, took_ms: Date.now() - started, finished_at: Date.now() };
  await redis
    .multi()
    .lPush(keys.done, JSON.stringify(finished))
    .lTrim(keys.done, 0, 99)
    .lRem(active, 1, raw)
    .exec();
  console.log(`${name} finished job ${job.id} in ${finished.took_ms} ms`);
  job = null;
  await report("idle");
}

await report("stopped");
console.log(`${name} stopped cleanly, ${prefix} keeps the waiting jobs for the next start`);
await redis.close();
