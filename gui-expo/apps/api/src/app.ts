import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./env.js";
import { tasks } from "./tasks.js";
import { laneInfo } from "./lane.js";

export const app = new Hono();

// Only the web target sends an Origin header; the app on a device calls without one.
app.use(cors({ origin: env.origins, allowMethods: ["GET"] }));

app.get("/healthz", (c) => c.text("ok"));
app.get("/lane", (c) => c.json(laneInfo(c)));
app.get("/", (c) => c.json({ ...laneInfo(c), tasks }));
