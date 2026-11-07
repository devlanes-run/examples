import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { serverEnv } from "./env.js";
import { laneInfo } from "./lane.js";
import { api } from "./routes/api.js";
import { pages } from "./routes/pages.js";

export const app = new Hono();

app.get("/healthz", (c) => c.text("ok"));
app.get("/lane", (c) => c.json(laneInfo(c)));
// brand/ links to _internal/brand, the CSS and logo every example shares.
app.use("/brand/*", serveStatic({ root: "./" }));
app.get("/styles.css", serveStatic({ path: "./src/styles.css" }));

// A form post must come from one of this lane's origins; JSON posts from the seed task pass.
app.use(csrf({ origin: serverEnv().origins }));
app.route("/api", api);
app.route("/", pages);
