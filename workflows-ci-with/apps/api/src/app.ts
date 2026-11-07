import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./env.js";
import { items } from "./items.js";
import { laneInfo } from "./lane.js";

export const app = new Hono();

// tests/lane.test.ts checks that this lane's web origin gets the header and another origin does not.
app.use(cors({ origin: env.origins, allowMethods: ["GET"] }));

app.get("/healthz", (c) => c.text("ok"));
app.get("/lane", (c) => c.json(laneInfo(c)));
app.get("/", (c) => c.json({ ...laneInfo(c), script: env.script, node_env: env.nodeEnv, items }));
app.get("/api/items", (c) => c.json({ lane: env.lane, items }));

app.notFound((c) => c.json({ error: `no route for ${c.req.method} ${c.req.path}` }, 404));
