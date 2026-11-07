import { Hono } from "hono";
import type { PortName } from "../env.js";
import { laneInfo } from "../lane.js";

/** `/healthz` and `/lane`, mounted on every port so each hostname can be checked on its own. */
export function commonRoutes(port: PortName): Hono {
  return new Hono()
    .get("/healthz", (c) => c.text("ok"))
    .get("/lane", (c) => c.json(laneInfo(c, port)));
}
