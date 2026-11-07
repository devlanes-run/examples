import { Hono } from "hono";
import { countView } from "../counter.js";
import { env } from "../env.js";
import { items } from "../items.js";

/** `GET /api/items`, which the gateway calls through its service binding. */
export const itemRoutes = new Hono<{ Bindings: Env }>();

itemRoutes.get("/items", async (c) => {
  const views = await countView(c.env.VIEWS);
  return c.json({ lane: env.lane, views, items });
});
