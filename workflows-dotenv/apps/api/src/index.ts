import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { env } from "./env.js";

serve({ fetch: app.fetch, port: env.port, hostname: env.host }, (info) => {
  console.log(`api listening on http://${info.address}:${info.port}, api URL ${env.urls.api}`);
});
