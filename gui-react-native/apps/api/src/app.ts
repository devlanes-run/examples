import { Hono } from "hono";
import { laneInfo } from "./lane.js";
import { orders } from "./orders.js";

export const app = new Hono();

app.get("/healthz", (c) => c.text("ok"));
app.get("/lane", (c) => c.json(laneInfo(c)));
app.get("/", (c) => c.json({ ...laneInfo(c), orders }));
