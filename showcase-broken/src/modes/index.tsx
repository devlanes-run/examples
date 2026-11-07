import { serveStatic } from "@hono/node-server/serve-static";
import { jsxRenderer } from "hono/jsx-renderer";
import { failures } from "../failures.js";
import { laneInfo } from "../lane.js";
import { createApp, listen } from "../server.js";
import { IndexPage } from "../views/IndexPage.js";

/** The one healthy service: a page listing every broken service of the lane. */
export function run(): void {
  const app = createApp();
  // brand/ links to _internal/brand, the CSS and logo every example shares.
  app.use("/brand/*", serveStatic({ root: "./" }));
  // Pages render their own <Layout>; the renderer only adds the doctype.
  app.use(jsxRenderer(({ children }) => <>{children}</>, { docType: true }));
  app.get("/", (c) => c.render(<IndexPage info={laneInfo(c)} failures={failures()} />));
  listen(app);
}
