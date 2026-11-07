import { createClient } from "redis";
import { env } from "./env.js";

const client = createClient({
  url: env.redis.url,
  socket: { connectTimeout: 5_000 },
  commandOptions: { timeout: 5_000 },
});
client.on("error", (err: Error) => console.error(`redis: ${err.message}`));

/** What the page and /api/state show about this lane's database in the shared Redis. */
export type RedisState = {
  port: number;
  db: number;
  visits: number;
};

/** Opens the connection to the shared Redis, selecting this lane's database index. */
export async function connectRedis(): Promise<void> {
  await client.connect();
}

/** Reads this lane's visit count. */
export async function redisState(): Promise<RedisState> {
  const visits = await client.get("visits");
  return { port: env.redis.port, db: env.redis.db, visits: Number(visits ?? 0) };
}

/** Adds one to this lane's visit count. */
export async function addVisit(): Promise<void> {
  await client.incr("visits");
}
