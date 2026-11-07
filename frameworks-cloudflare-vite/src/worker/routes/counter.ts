import { Hono } from "hono";
import { incrementCount, readCount } from "../counter";
import type { AppEnv } from "../env";

/** `GET /api/counter` reads the lane's count and `POST` adds one. */
export const counter = new Hono<AppEnv>()
  .get("/", async (c) => c.json({ count: await readCount(c.env.COUNTER) }))
  .post("/", async (c) => c.json({ count: await incrementCount(c.env.COUNTER) }))
  .all("/", (c) => c.json({ error: "method not allowed" }, 405));
