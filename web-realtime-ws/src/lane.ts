import type { Context } from "hono";
import { env, type PortName } from "./env.js";

export type LaneInfo = {
  project: string;
  lane: number;
  lane_name: string;
  branch: string;
  service: string;
  port: number;
  url: string | null;
};

/** The lane values every example shows on its page and returns from `/lane`, for the port that answered. */
export function laneInfo(c: Context, port: PortName): LaneInfo {
  // Only requests that came through the devlanes proxy carry X-Forwarded-Host.
  const forwarded = c.req.header("x-forwarded-host");
  return {
    project: env.project,
    lane: env.lane,
    lane_name: env.laneName,
    branch: env.branch,
    service: env.service,
    port: env.ports[port],
    url: forwarded ? `https://${forwarded}` : null,
  };
}
