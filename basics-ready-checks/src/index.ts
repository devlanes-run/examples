import { serve } from "@hono/node-server";
import { setTimeout as sleep } from "node:timers/promises";
import { createApp } from "./app.js";
import { env, type ModeName } from "./env.js";
import type { Mode } from "./mode.js";
import { http } from "./modes/http.js";
import { index } from "./modes/index.js";
import { legacyHost } from "./modes/legacy-host.js";
import { log } from "./modes/log.js";
import { ownHost } from "./modes/own-host.js";
import { slowStart } from "./modes/slow-start.js";
import { tcp } from "./modes/tcp.js";

const modes: Record<ModeName, Mode> = {
  index,
  http,
  tcp,
  log,
  "own-host": ownHost,
  "legacy-host": legacyHost,
  "slow-start": slowStart,
};

const mode = modes[env.mode];

if (mode.startDelayMs) {
  console.log(`waiting ${mode.startDelayMs} ms before listening`);
  await sleep(mode.startDelayMs);
}

// ready.log in devlanes.yaml matches this line.
serve({ fetch: createApp(mode).fetch, port: env.port, hostname: env.host }, (info) => {
  console.log(`${env.service} listening on http://${info.address}:${info.port}`);
});
