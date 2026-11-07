import { serveStatic } from "@hono/node-server/serve-static";
import { laneInfo } from "@provider-stubs/shared";
import { Hono } from "hono";
import { jsxRenderer } from "hono/jsx-renderer";
import { env } from "./env.js";
import { sendRoutes } from "./routes/send.js";
import { HomePage } from "./views/HomePage.js";

export const app = new Hono();

app.get("/healthz", (c) => c.text("ok"));
app.get("/lane", (c) => c.json(laneInfo(c, env)));
// brand/ links to _internal/brand, the CSS and logo every example shares.
app.use("/brand/*", serveStatic({ root: "./" }));
app.get("/styles.css", serveStatic({ path: "./src/styles.css" }));

// Pages render their own <Layout>; the renderer only adds the doctype.
app.use(jsxRenderer(({ children }) => <>{children}</>, { docType: true }));
app.get("/", (c) => c.render(<HomePage info={laneInfo(c, env)} />));
app.route("/", sendRoutes);

app.notFound((c) => c.json({ error: "not_found" }, 404));
