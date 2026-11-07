import { Hono } from "hono";
import { addVisit } from "../redis.js";

/** The "Add a visit" form: increments the lane's counter in Redis and goes back to the page. */
export const visits = new Hono();

visits.post("/", async (c) => {
  await addVisit();
  return c.redirect("/", 303);
});
