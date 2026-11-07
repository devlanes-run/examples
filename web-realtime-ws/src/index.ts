import { env } from "./env.js";
import { ticker } from "./realtime/ticker.js";
import { startAdminServer } from "./servers/admin.js";
import { startMainServer } from "./servers/main.js";
import { startWsServer } from "./servers/ws.js";

ticker.start();
// The ready check probes /healthz on the main port, so that port opens last: once it answers,
// the ws and admin ports listen too.
await startWsServer();
await startAdminServer();
await startMainServer();

const { ports } = env;
console.log(
  `lane ${env.lane}: page on ${ports.default}, ws on ${ports.ws}, admin on ${ports.admin}`,
);
