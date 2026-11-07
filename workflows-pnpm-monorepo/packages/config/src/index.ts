// No Node imports: the Vite apps bundle this package for the browser too.
export type Env = Readonly<Record<string, unknown>>;

export interface Lane {
  project: string;
  lane: number;
  laneName: string;
  branch: string;
  service: string;
  port: number;
}

export interface ServerEnv extends Lane {
  host: string;
  origins: string[];
}

export interface PageEnv extends Lane {
  apiUrl: string;
  webUrl: string;
  adminUrl: string;
  billingUrl: string | undefined;
}

function text(env: Env, key: string): string | undefined {
  const value = env[key];
  return typeof value === "string" && value !== "" ? value : undefined;
}

function required(env: Env, key: string): string {
  const value = text(env, key);
  if (value === undefined) {
    throw new Error(`${key} is not set; start this app with devlanes start`);
  }
  return value;
}

/** What devlanes gives a server process: PORT, HOST, DEVLANES_* and LANE_LABEL. */
export function serverEnv(env: Env): ServerEnv {
  return {
    port: Number(required(env, "PORT")),
    host: text(env, "HOST") ?? "127.0.0.1",
    project: required(env, "DEVLANES_LANE_PROJECT"),
    lane: Number(required(env, "DEVLANES_LANE")),
    laneName: required(env, "DEVLANES_LANE_NAME"),
    branch: text(env, "LANE_LABEL") ?? "",
    service: required(env, "DEVLANES_SERVICE"),
    origins: (text(env, "DEVLANES_ORIGINS") ?? "").split(",").filter(Boolean),
  };
}

/** The same lane values as a Vite page sees them in import.meta.env (VITE_* from devlanes.yaml). */
export function pageEnv(env: Env): PageEnv {
  return {
    project: required(env, "VITE_PROJECT"),
    lane: Number(required(env, "VITE_LANE")),
    laneName: required(env, "VITE_LANE_NAME"),
    branch: text(env, "VITE_LANE_LABEL") ?? "",
    service: required(env, "VITE_SERVICE"),
    port: Number(required(env, "VITE_PORT")),
    apiUrl: required(env, "VITE_API_URL"),
    webUrl: required(env, "VITE_WEB_URL"),
    adminUrl: required(env, "VITE_ADMIN_URL"),
    // Empty when no lane of pnpm-billing runs (the default() in devlanes.yaml).
    billingUrl: text(env, "VITE_BILLING_URL"),
  };
}

/**
 * Body of GET /lane. X-Forwarded-Host is set by the devlanes proxy, so an
 * https url proves the request came through it.
 */
export function laneJson(lane: Lane, forwardedHost: string | undefined, host: string | undefined) {
  return {
    project: lane.project,
    lane: lane.lane,
    lane_name: lane.laneName,
    branch: lane.branch,
    service: lane.service,
    port: lane.port,
    url: forwardedHost ? `https://${forwardedHost}` : `http://${host}`,
  };
}
