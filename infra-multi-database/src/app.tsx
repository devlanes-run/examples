import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { jsxRenderer } from "hono/jsx-renderer";
import { env } from "./env.js";
import { laneInfo } from "./lane.js";
import { api } from "./routes/api.js";
import { dashboard } from "./routes/dashboard.js";
import { storeActions } from "./routes/stores.js";

export const app = new Hono();

app.get("/healthz", (c) => c.text("ok"));
app.get("/lane", (c) => c.json(laneInfo(c)));
// brand/ links to _internal/brand, the CSS and logo every example shares.
app.use("/brand/*", serveStatic({ root: "./" }));
app.get("/styles.css", serveStatic({ path: "./src/styles.css" }));

// The store forms write data, so a post must come from one of this lane's origins.
app.use(csrf({ origin: env.origins }));
// Pages render their own <Layout>; the renderer only adds the doctype.
app.use(jsxRenderer(({ children }) => <>{children}</>, { docType: true }));
app.route("/api", api);
app.route("/stores", storeActions);
app.route("/", dashboard);
