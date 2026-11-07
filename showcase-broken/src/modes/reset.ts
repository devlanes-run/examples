import { RESPONSE_ALREADY_SENT } from "@hono/node-server/utils/response";
import { createApp, listen } from "../server.js";

/** Closes the connection without an answer on every route except `/healthz` and `/lane`. */
export function run(): void {
  const app = createApp();
  app.all("*", (c) => {
    console.log(`${c.req.path}: destroying the socket without an answer`);
    c.env.incoming.socket.destroy();
    return RESPONSE_ALREADY_SENT;
  });
  listen(app);
}
