import { createClient } from "redis";
import { redisEnv } from "./env.js";

/** The client for this lane's Redis index; REDIS_URL's path selects the index. */
export const redis = createClient({
  url: redisEnv().url,
  socket: { connectTimeout: 5_000 },
});

redis.on("error", (err: Error) => console.error(`redis: ${err.message}`));
