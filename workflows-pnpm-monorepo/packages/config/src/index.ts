// No Node imports: the Vite apps bundle this package for the browser too.

/** A bag of variables: `process.env` on a server, `import.meta.env` in a Vite page. */
export type Env = Readonly<Record<string, unknown>>;

/** The lane values every app shows. */
export type Lane = {
  project: string;
  lane: number;
  laneName: string;
  branch: string;
  service: string;
  port: number;
};

/** What a server process reads from devlanes. */
export type ServerEnv = Lane & {
  host: string;
  origins: string[];
};

/** What a Vite page reads from the `VITE_*` values in devlanes.yaml. */
export type PageEnv = Lane & {
  apiUrl: string;
  webUrl: string;
  adminUrl: string;
  billingUrl: string | undefined;
};

/** The body of `GET /lane`. */
export type LaneJson = {
  project: string;
  lane: number;
  lane_name: string;
  branch: string;
  service: string;
  port: number;
  url: string | null;
};

/** Returns a non-empty string variable, or undefined. */
export function optional(env: Env, key: string): string | undefined {
  const value = env[key];
  return typeof value === "string" && value !== "" ? value : undefined;
}

/** Returns a variable devlanes sets, failing early with a hint when the app runs outside devlanes. */
export function required(env: Env, key: string): string {
  const value = optional(env, key);
  if (value === undefined) {
    throw new Error(`${key} is not set; start this app with devlanes start`);
  }
  return value;
}

/** Parses what devlanes gives a server process: PORT, HOST, DEVLANES_* and LANE_LABEL. */
export function serverEnv(env: Env): ServerEnv {
  return {
    port: Number(required(env, "PORT")),
    host: optional(env, "HOST") ?? "127.0.0.1",
    project: required(env, "DEVLANES_LANE_PROJECT"),
    lane: Number(required(env, "DEVLANES_LANE")),
    laneName: required(env, "DEVLANES_LANE_NAME"),
    branch: required(env, "LANE_LABEL"),
    service: required(env, "DEVLANES_SERVICE"),
    // This lane's https origins (web, admin, api), for CORS.
    origins: (optional(env, "DEVLANES_ORIGINS") ?? "").split(",").filter(Boolean),
  };
}

/** Parses the same lane values as a Vite page sees them in `import.meta.env`. */
export function pageEnv(env: Env): PageEnv {
  return {
    project: required(env, "VITE_PROJECT"),
    lane: Number(required(env, "VITE_LANE")),
    laneName: required(env, "VITE_LANE_NAME"),
    branch: required(env, "VITE_LANE_LABEL"),
    service: required(env, "VITE_SERVICE"),
    port: Number(required(env, "VITE_PORT")),
    apiUrl: required(env, "VITE_API_URL"),
    webUrl: required(env, "VITE_WEB_URL"),
    adminUrl: required(env, "VITE_ADMIN_URL"),
    // Empty while no lane of example-pnpm-billing runs (the default() in devlanes.yaml).
    billingUrl: optional(env, "VITE_BILLING_URL"),
  };
}

/** Builds `GET /lane`; only requests through the devlanes proxy carry X-Forwarded-Host. */
export function laneJson(lane: Lane, forwardedHost: string | undefined): LaneJson {
  return {
    project: lane.project,
    lane: lane.lane,
    lane_name: lane.laneName,
    branch: lane.branch,
    service: lane.service,
    port: lane.port,
    url: forwardedHost ? `https://${forwardedHost}` : null,
  };
}
