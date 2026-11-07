import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { env } from "./env.js";
import { modeInfo } from "./mode.js";

serve({ fetch: app.fetch, port: env.port, hostname: env.host }, (info) => {
  const mode = modeInfo();
  console.log(`api listening on http://${info.address}:${info.port}`);
  console.log(
    `script=${mode.script} code=${mode.runs_from} NODE_ENV=${mode.node_env} profile=${mode.profile} file=${mode.project_file} LOG_LEVEL=${mode.log_level}`,
  );
});
