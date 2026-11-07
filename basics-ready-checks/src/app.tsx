import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { jsxRenderer } from "hono/jsx-renderer";
import { onlyHost } from "./host-guard.js";
import { laneInfo } from "./lane.js";
import type { Mode } from "./mode.js";
import { ServicePage } from "./views/ServicePage.js";

/** Builds the server for one mode; every mode shares /healthz, /lane and the brand files. */
export function createApp(mode: Mode): Hono {
  const app = new Hono();

  // Registered first so it also refuses /healthz, which is what the ready checks probe.
  if (mode.allowedHost) app.use(onlyHost(mode.allowedHost));

  app.get("/healthz", (c) => c.text("ok"));
  app.get("/lane", (c) => c.json(laneInfo(c)));
  // brand/ links to _internal/brand, the CSS and logo every example shares.
  app.use("/brand/*", serveStatic({ root: "./" }));

  // Pages render their own <Layout>; the renderer only adds the doctype.
  app.use(jsxRenderer(({ children }) => <>{children}</>, { docType: true }));
  app.get("/", (c) => {
    const info = laneInfo(c);
    return c.render(
      mode.page?.(info) ?? (
        <ServicePage info={info} mode={mode} host={c.req.header("host") ?? ""} />
      ),
    );
  });

  return app;
}
