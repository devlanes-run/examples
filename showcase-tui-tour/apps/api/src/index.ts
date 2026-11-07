import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { currentDatabase } from "./db.js";
import { redisEnv, serverEnv } from "./env.js";
import { redis } from "./redis.js";

const env = serverEnv();

console.log(`connected to postgres (${await currentDatabase()})`);
await redis.connect();
console.log(`connected to redis (db ${redisEnv().index})`);

serve({ fetch: app.fetch, port: env.port, hostname: env.host }, (info) => {
  console.log(`api listening on http://${info.address}:${info.port}`);
});
