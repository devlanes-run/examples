import type { IncomingMessage } from "node:http";
import { env } from "./env.mts";

export type LaneInfo = {
  project: string;
  lane: number;
  lane_name: string;
  branch: string;
  service: string;
  port: number;
  url: string | null;
};

/** The lane values every example shows on its page and returns from `/lane`. */
export function laneInfo(req: IncomingMessage): LaneInfo {
  // Only requests that came through the devlanes proxy carry X-Forwarded-Host.
  const forwarded = req.headers["x-forwarded-host"];
  return {
    project: env.project,
    lane: env.lane,
    lane_name: env.laneName,
    branch: env.branch,
    service: env.service,
    port: env.port,
    url: typeof forwarded === "string" ? `https://${forwarded}` : null,
  };
}
