import type { Context } from "hono";
import { Hono } from "hono";
import type { ServerEnv } from "./env.js";

export type LaneInfo = {
  project: string;
  lane: number;
  lane_name: string;
  branch: string;
  service: string;
  port: number;
  url: string | null;
};

/** The lane values every service shows on its page and returns from `/lane`. */
export function laneInfo(c: Context, env: ServerEnv): LaneInfo {
  // Only requests that came through the devlanes proxy carry X-Forwarded-Host.
  const forwarded = c.req.header("x-forwarded-host");
  return {
    project: env.project,
    lane: env.lane,
    lane_name: env.laneName,
    branch: env.branch,
    service: env.service,
    port: env.port,
    url: forwarded ? `https://${forwarded}` : null,
  };
}

/** `/healthz` for the ready check and `/lane` for the lane values, mounted by every server. */
export function laneRoutes(env: ServerEnv): Hono {
  return new Hono()
    .get("/healthz", (c) => c.text("ok"))
    .get("/lane", (c) => c.json(laneInfo(c, env)));
}
