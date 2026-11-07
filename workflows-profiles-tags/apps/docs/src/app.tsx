import { serveStatic } from "@hono/node-server/serve-static";
import { laneInfo, laneRoutes } from "@profiles-tags/shared";
import { Hono } from "hono";
import { jsxRenderer } from "hono/jsx-renderer";
import { COMPONENTS } from "./components.js";
import { env } from "./env.js";
import { DocsPage } from "./views/DocsPage.js";

export const app = new Hono();

app.route("/", laneRoutes(env));
// brand/ links to _internal/brand, the CSS and logo every example shares.
app.use("/brand/*", serveStatic({ root: "./" }));

// Pages render their own <Layout>; the renderer only adds the doctype.
app.use(jsxRenderer(({ children }) => <>{children}</>, { docType: true }));
app.get("/", (c) => c.render(<DocsPage info={laneInfo(c, env)} components={COMPONENTS} />));
