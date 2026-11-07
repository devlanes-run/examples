import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { databaseEnv, serverEnv } from "./env.js";

const env = serverEnv();

serve({ fetch: app.fetch, port: env.port, hostname: env.host }, (info) => {
  console.log(
    `api listening on http://${info.address}:${info.port}, database ${databaseEnv().name}`,
  );
});
