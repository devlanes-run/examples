import { serve, type HttpBindings } from "@hono/node-server";
import { Hono } from "hono";
import { env } from "./env.js";
import { laneInfo } from "./lane.js";

/** A Hono app whose handlers can reach the Node request and its socket. */
export type App = Hono<{ Bindings: HttpBindings }>;

type AppOptions = {
  /** Set to false when the mode answers `/healthz` itself. */
  healthz?: boolean;
};

/** Creates an app with the routes every mode answers: `/lane` and, by default, `/healthz`. */
export function createApp({ healthz = true }: AppOptions = {}): App {
  const app: App = new Hono();
  app.get("/lane", (c) => c.json(laneInfo(c)));
  if (healthz) {
    app.get("/healthz", (c) => c.text("ok"));
  }
  return app;
}

/** Serves the app on `port`; 0 lets the OS pick one. */
export function listen(app: App, port = env.port): void {
  serve({ fetch: app.fetch, port, hostname: env.host }, (info) => {
    console.log(`${env.service} listening on http://${info.address}:${info.port}`);
  });
}
