import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { env } from "./env.js";
import { connectRedis } from "./redis.js";

await connectRedis();

serve({ fetch: app.fetch, port: env.port, hostname: env.host }, (info) => {
  console.log(`postgres-per-lane listening on http://${info.address}:${info.port}`);
});
