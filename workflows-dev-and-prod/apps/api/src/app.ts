import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./env.js";
import { laneInfo } from "./lane.js";
import { modeInfo } from "./mode.js";
import { releases } from "./releases.js";

export const app = new Hono();

// The page on the lane's own hostname reads these answers cross-origin.
app.use(cors({ origin: env.origins }));

if (env.logLevel === "debug") {
  app.use(async (c, next) => {
    console.log(`debug: ${c.req.method} ${c.req.path}`);
    await next();
  });
}

app.get("/healthz", (c) => c.text("ok"));
app.get("/lane", (c) => c.json(laneInfo(c)));
app.get("/mode", (c) => c.json(modeInfo()));
app.get("/", (c) => c.json({ ...laneInfo(c), mode: modeInfo(), releases }));
app.get("/api/releases", (c) => c.json({ releases }));
