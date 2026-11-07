import type { Context } from "hono";

/** The lane values a service parses from the variables devlanes sets, in its own `env.ts`. */
export type LaneEnv = {
  project: string;
  lane: number;
  laneName: string;
  branch: string;
  service: string;
  port: number;
};

export type LaneInfo = {
  project: string;
  lane: number;
  lane_name: string;
  branch: string;
  service: string;
  port: number;
  url: string | null;
};

/** The lane values every page shows and `/lane` returns. */
export function laneInfo(c: Context, env: LaneEnv): LaneInfo {
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
