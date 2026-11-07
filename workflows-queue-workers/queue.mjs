import { createClient } from "redis";

// Every key of a lane's queue starts with QUEUE_PREFIX, which comes from
// lanes.vars, so lanes share one Redis without seeing each other's jobs.
export const prefix = process.env.QUEUE_PREFIX;

export const keys = {
  nextId: `${prefix}:next_id`,
  waiting: `${prefix}:waiting`,
  active: (worker) => `${prefix}:active:${worker}`,
  done: `${prefix}:done`,
  workers: `${prefix}:workers`,
};

export async function connect() {
  const redis = createClient({ url: process.env.REDIS_URL });
  redis.on("error", (err) => console.error(`redis: ${err.message}`));
  await redis.connect();
  return redis;
}
