import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { env, type KindName } from "./env.js";
import type { Kind } from "./kind.js";
import { api } from "./kinds/api.js";
import { job } from "./kinds/job.js";
import { web } from "./kinds/web.js";
import { worker } from "./kinds/worker.js";
import { boot, pick, startBursts } from "./load.js";
import { countBurst, markReady, seconds } from "./stats.js";

const kinds: Record<KindName, Kind> = { api, web, worker, job };
const kind = kinds[env.kind];

const bootMs = pick(env.boot);
console.log(`${env.service} (${env.kind}) starting, listens in ${seconds(bootMs)} s`);
await boot(bootMs);

serve({ fetch: createApp(kind).fetch, port: env.port, hostname: env.host }, (info) => {
  const readyMs = markReady();
  // ready.log in devlanes.yaml matches "ready after" for workers and jobs.
  console.log(
    `${env.service} ready after ${seconds(readyMs)} s on http://${info.address}:${info.port}`,
  );
  startBursts(env.burst, env.burstEvery, (ms) => {
    const count = countBurst();
    kind.onBurst?.(count, ms);
  });
});
