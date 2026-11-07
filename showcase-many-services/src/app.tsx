import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { jsxRenderer } from "hono/jsx-renderer";
import type { Kind } from "./kind.js";
import { laneInfo } from "./lane.js";
import { stats } from "./stats.js";

/** Builds the server for one kind; every kind shares /healthz, /lane, /stats and the page assets. */
export function createApp(kind: Kind): Hono {
  const app = new Hono();

  app.get("/healthz", (c) => c.text("ok"));
  app.get("/lane", (c) => c.json(laneInfo(c)));
  // The index page reads this from every service of the lane.
  app.get("/stats", (c) => c.json(stats()));
  // brand/ links to _internal/brand, the CSS and logo every example shares.
  app.use("/brand/*", serveStatic({ root: "./" }));
  app.get("/styles.css", serveStatic({ path: "./src/styles.css" }));

  // Pages render their own <Layout>; the renderer only adds the doctype.
  app.use(jsxRenderer(({ children }) => <>{children}</>, { docType: true }));
  kind.routes(app);

  return app;
}
