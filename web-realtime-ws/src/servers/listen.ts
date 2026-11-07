import { serve, type ServerType } from "@hono/node-server";
import type { Hono } from "hono";
import { WebSocketServer } from "ws";
import { env, type PortName } from "../env.js";

type ListenOptions = {
  /** Accept WebSocket upgrades on this port through the routes' `upgradeWebSocket`. */
  websocket?: boolean;
};

/** Serves `app` on the named port and resolves once the port accepts connections. */
export function listen(
  app: Hono,
  port: PortName,
  options: ListenOptions = {},
): Promise<ServerType> {
  // @hono/node-server 2 handles upgrades itself; @hono/node-ws only supports node-server 1.
  // Each port gets its own `ws` server in noServer mode, since one is bound to one HTTP server.
  const websocket = options.websocket
    ? { server: new WebSocketServer({ noServer: true }) }
    : undefined;
  return new Promise((resolve, reject) => {
    const server = serve(
      { fetch: app.fetch, port: env.ports[port], hostname: env.host, websocket },
      () => resolve(server),
    );
    server.once("error", reject);
  });
}
