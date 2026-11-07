import type { Context } from "hono";

export type LaneInfo = {
  project: string;
  lane: number;
  lane_name: string;
  branch: string | null;
  service: string;
  port: number;
  url: string | null;
};

/** The values of the process answering, as each server reads them from its environment. */
export type ProcessValues = {
  project: string;
  lane: number;
  laneName: string;
  branch: string | null;
  service: string;
  port: number;
};

/** The lane values every example shows on its page and returns from `/lane`. */
export function laneInfo(c: Context, values: ProcessValues): LaneInfo {
  // Only requests that came through the devlanes proxy carry X-Forwarded-Host.
  const forwarded = c.req.header("x-forwarded-host");
  return {
    project: values.project,
    lane: values.lane,
    lane_name: values.laneName,
    branch: values.branch,
    service: values.service,
    port: values.port,
    url: forwarded ? `https://${forwarded}` : null,
  };
}
