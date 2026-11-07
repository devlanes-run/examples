import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { jsxRenderer } from "hono/jsx-renderer";
import { laneInfo } from "./lane.js";
import { HomePage } from "./views/HomePage.js";

export const app = new Hono();

app.get("/healthz", (c) => c.text("ok"));
app.get("/lane", (c) => c.json(laneInfo(c)));
// brand/ links to _internal/brand, the CSS and logo every example shares.
app.use("/brand/*", serveStatic({ root: "./" }));

// Pages render their own <Layout>; the renderer only adds the doctype.
app.use(jsxRenderer(({ children }) => <>{children}</>, { docType: true }));
app.get("/", (c) => c.render(<HomePage info={laneInfo(c)} />));
