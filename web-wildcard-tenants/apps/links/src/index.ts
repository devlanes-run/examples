import { serve } from "@hono/node-server";
import { env } from "@example-wildcard-tenants/shared";
import { app } from "./app.js";

serve({ fetch: app.fetch, port: env.port, hostname: env.host }, (info) => {
  console.log(`links listening on http://${info.address}:${info.port}`);
});
