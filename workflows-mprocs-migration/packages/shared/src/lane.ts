import type { Context } from "hono";

/**
 * The lane values a service reads in its own `env.ts`. Under mprocs (`before/`) devlanes sets
 * nothing, so every field but the port is null.
 */
export type LaneEnv = {
  project: string | null;
  lane: number | null;
  laneName: string | null;
  branch: string | null;
  service: string | null;
  port: number;
};

export type LaneInfo = {
  project: string | null;
  lane: number | null;
  lane_name: string | null;
  branch: string | null;
  service: string | null;
  port: number;
  url: string | null;
};

/** Parses the variables devlanes sets on every service, with null for each one that is unset. */
export function laneEnv(vars: NodeJS.ProcessEnv): Omit<LaneEnv, "port"> {
  const lane = vars.DEVLANES_LANE;
  return {
    project: vars.DEVLANES_LANE_PROJECT || null,
    lane: lane ? Number(lane) : null,
    laneName: vars.DEVLANES_LANE_NAME || null,
    // Set in devlanes.yaml from ${{ lane.label }}.
    branch: vars.LANE_LABEL || null,
    service: vars.DEVLANES_SERVICE || null,
  };
}

/** The lane values every page shows and `/lane` returns. */
export function laneInfo(c: Context, env: LaneEnv): LaneInfo {
  // Only requests that came through a proxy carry X-Forwarded-Host.
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
