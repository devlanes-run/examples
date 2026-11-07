import { RESPONSE_ALREADY_SENT } from "@hono/node-server/utils/response";
import { createApp, listen } from "../server.js";

const SWITCHING_PROTOCOLS =
  "HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: acme\r\n\r\n";

/** Answers plain requests with 101 Switching Protocols, except `/healthz` and `/lane`. */
export function run(): void {
  const app = createApp();
  app.all("*", (c) => {
    console.log(`${c.req.path}: answering a plain ${c.req.method} with 101`);
    // Written to the socket because node:http only sends 101 to requests that asked to upgrade.
    c.env.incoming.socket.end(SWITCHING_PROTOCOLS);
    return RESPONSE_ALREADY_SENT;
  });
  listen(app);
}
