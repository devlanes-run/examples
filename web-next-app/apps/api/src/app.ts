import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./env.js";
import { laneInfo } from "./lane.js";
import { orders } from "./orders.js";

export const app = new Hono();

// The web page only fetches on the server, but a browser on the lane's origins may call too.
app.use(cors({ origin: env.origins }));

app.get("/healthz", (c) => c.text("ok"));
app.get("/lane", (c) => c.json(laneInfo(c)));
app.get("/api/items", (c) => c.json(orders));
app.get("/", (c) => c.json({ ...laneInfo(c), items: orders }));
