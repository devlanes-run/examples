import { env } from "./env";

export type LaneInfo = {
  project: string;
  lane: number;
  lane_name: string;
  branch: string;
  service: string;
  port: number;
  url: string | null;
};

/** The lane values the page shows and `/lane` returns. */
export function laneInfo(forwardedHost: string | null): LaneInfo {
  const { project, lane, laneName, branch, service, port } = env();
  return {
    project,
    lane,
    lane_name: laneName,
    branch,
    service,
    port,
    // Only requests that came through the devlanes proxy carry X-Forwarded-Host.
    url: forwardedHost ? `https://${forwardedHost}` : null,
  };
}
