import { Hono } from "hono";
import { env } from "./env.js";
import { laneInfo } from "./lane.js";

export const app = new Hono();

app.get("/healthz", (c) => c.text("ok"));
app.get("/lane", (c) => c.json(laneInfo(c)));
app.get("/", (c) =>
  c.json({ ...laneInfo(c), note: "declared only in devlanes.local.yaml", api_url: env.apiUrl }),
);
