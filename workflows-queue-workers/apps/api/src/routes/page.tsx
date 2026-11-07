import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { env } from "../env.js";
import { laneInfo } from "../lane.js";
import { MAX_ENQUEUE, parseCount, queue } from "../queue.js";
import { HomePage } from "../views/HomePage.js";
import { JobsLive } from "../views/JobsLive.js";

/** The page, the part of it the browser refreshes, and the enqueue form's target. */
export const pageRoutes = new Hono()
  .get("/", async (c) => c.render(<HomePage info={laneInfo(c)} state={await queue.list()} />))
  // src/client/live.ts swaps this into the page every second, so both share one rendering.
  .get("/jobs/live", async (c) => c.html(<JobsLive state={await queue.list()} />))
  // Form posts must come from one of this lane's origins.
  .post("/jobs", csrf({ origin: env.origins }), async (c) => {
    const body = await c.req.parseBody();
    const count = parseCount(body.count);
    if (count === null) {
      return c.text(`count must be a whole number from 1 to ${MAX_ENQUEUE}\n`, 400);
    }
    await queue.enqueue(count);
    return c.redirect("/", 303);
  });
