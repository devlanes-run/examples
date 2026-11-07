import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { jsxRenderer } from "hono/jsx-renderer";
import { docsEnv } from "../env.js";
import { laneInfo, type ProcessValues } from "../lane.js";
import { DocsPage } from "../views/DocsPage.js";

/** The docs server's app, listening on `port` outside any devlanes service. */
export function docsApp(port: number): Hono {
  const values: ProcessValues = { ...docsEnv(), service: "docs-server", port };
  const app = new Hono();

  app.get("/healthz", (c) => c.text("ok"));
  app.get("/lane", (c) => c.json(laneInfo(c, values)));
  app.use("/brand/*", serveStatic({ root: "./" }));

  app.use(jsxRenderer(({ children }) => <>{children}</>, { docType: true }));
  app.get("/", (c) => c.render(<DocsPage info={laneInfo(c, values)} />));
  return app;
}
