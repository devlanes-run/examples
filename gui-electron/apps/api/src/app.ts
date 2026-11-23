import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./env.js";
import { laneInfo } from "./lane.js";
import { notes } from "./notes.js";

export const app = new Hono();

// The renderer runs on the web service's hostname, so its calls here are cross-origin.
app.use(cors({ origin: env.origins, allowMethods: ["GET"] }));

app.get("/healthz", (c) => c.text("ok"));
app.get("/lane", (c) => c.json(laneInfo(c)));
app.get("/", (c) => c.json({ ...laneInfo(c), notes }));
