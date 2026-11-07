export type LaneInfo = {
  project: string | undefined;
  lane: number;
  lane_name: string | undefined;
  branch: string | undefined;
  service: string | undefined;
  port: number;
  url: string | null;
};

// Only requests that came through the devlanes proxy carry X-Forwarded-Host.
export function laneInfo(forwardedHost: string | null): LaneInfo {
  const env = process.env;
  return {
    project: env.DEVLANES_LANE_PROJECT,
    lane: Number(env.DEVLANES_LANE),
    lane_name: env.DEVLANES_LANE_NAME,
    branch: env.LANE_LABEL,
    service: env.DEVLANES_SERVICE,
    port: Number(env.PORT),
    url: forwardedHost ? `https://${forwardedHost}` : null,
  };
}
