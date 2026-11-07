import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { serverEnv } from "./env.js";
import { laneInfo } from "./lane.js";
import { auth } from "./routes/auth.js";
import { pages } from "./routes/pages.js";

export const app = new Hono();

app.get("/healthz", (c) => c.text("ok"));
app.get("/lane", (c) => c.json(laneInfo(c, serverEnv())));
// brand/ links to _internal/brand, the CSS and logo every example shares.
app.use("/brand/*", serveStatic({ root: "./" }));

app.route("/", auth);
app.route("/", pages);
