import type { Context } from "hono";
import { databaseEnv, serverEnv } from "./env.js";

export type LaneInfo = {
  project: string;
  lane: number;
  lane_name: string;
  branch: string;
  service: string;
  port: number;
  url: string | null;
  database: string;
};

/** The lane values the page shows and `/lane` returns, plus the lane's database name. */
export function laneInfo(c: Context): LaneInfo {
  const env = serverEnv();
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
    database: databaseEnv().name,
  };
}
