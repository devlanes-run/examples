import { laneJson, type LaneJson } from "@acme/config";
import type { Context } from "hono";
import { env } from "./env.js";

/** The lane values the page shows and `/lane` returns. */
export type LaneInfo = LaneJson;

/** The lane values for one request; `url` is set only when it came through the devlanes proxy. */
export function laneInfo(c: Context): LaneInfo {
  return laneJson(env, c.req.header("x-forwarded-host"));
}
