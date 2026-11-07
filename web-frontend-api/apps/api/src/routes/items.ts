import { Hono } from "hono";
import { env } from "../env.js";
import { items } from "../items.js";

/** `GET /api/items`: the catalogue, tagged with the lane that answered. */
export const itemRoutes = new Hono().get("/", (c) => c.json({ lane: env.lane, items }));
