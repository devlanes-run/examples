import type { Context } from "hono";
import { env } from "./env.js";

/** The lane values every example shows on its page and returns from `/lane`. */
export type LaneInfo = {
  project: string;
  lane: number;
  lane_name: string;
  branch: string;
  service: string;
  port: number;
  url: string | null;
};

/** The lane values for this request; `url` is set only when it came through the devlanes proxy. */
export function laneInfo(c: Context): LaneInfo {
  // The app on a device calls the port directly, so it gets no X-Forwarded-Host.
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
