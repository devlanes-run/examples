import type { Context } from "hono";
import { env } from "./env.js";

export type LaneInfo = {
  project: string;
  lane: number;
  lane_name: string;
  branch: string;
  service: string;
  port: number;
  url: string | null;
};

/** The lane values every example returns from `/lane`. */
export function laneInfo(c: Context): LaneInfo {
  // Only requests that came through the devlanes proxy carry X-Forwarded-Host. Calls through the
  // service binding skip the proxy, so they get null.
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
