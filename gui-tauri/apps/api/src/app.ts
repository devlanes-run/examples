import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env } from "./env.js";
import { laneInfo } from "./lane.js";
import { releases } from "./releases.js";

export const app = new Hono();

// `devlanes logs api` then shows each request the desktop window makes.
app.use(logger());
// The desktop window loads its page from desktop-web, another origin, so the API sends CORS
// headers to this lane's origins only.
app.use(cors({ origin: env.origins, allowMethods: ["GET"] }));

app.get("/healthz", (c) => c.text("ok"));
app.get("/lane", (c) => c.json(laneInfo(c)));
app.get("/", (c) => c.json({ ...laneInfo(c), releases }));
