import { Hono } from "hono";
import { laneInfo } from "../lane.js";
import { MAX_ENQUEUE, parseCount, queue } from "../queue.js";

/** `GET /api/jobs` and `POST /api/jobs?count=N`, the queue as JSON for scripts and curl. */
export const apiRoutes = new Hono()
  .get("/jobs", async (c) => c.json({ ...laneInfo(c), ...(await queue.list()) }))
  .post("/jobs", async (c) => {
    const count = parseCount(c.req.query("count"));
    if (count === null) {
      return c.json({ error: `count must be a whole number from 1 to ${MAX_ENQUEUE}` }, 400);
    }
    return c.json({ queue: queue.keys.waiting, enqueued: await queue.enqueue(count) });
  });
