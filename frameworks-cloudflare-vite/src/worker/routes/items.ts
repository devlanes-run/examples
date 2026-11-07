import { Hono } from "hono";
import { catalogue } from "../catalogue";
import type { AppEnv } from "../env";
import { laneInfo } from "../lane";

/** `GET /api/items`: the lane values plus the mock catalogue. */
export const items = new Hono<AppEnv>().get("/", (c) =>
  c.json({ ...laneInfo(c), items: catalogue }),
);
