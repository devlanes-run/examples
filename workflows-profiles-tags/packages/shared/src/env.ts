/** Reads a variable devlanes sets, failing early with a hint when the process runs outside devlanes. */
export function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; start this service with devlanes start`);
  }
  return value;
}

/** The lane values devlanes gives every process of the lane. */
export type LaneEnv = {
  project: string;
  lane: number;
  laneName: string;
  service: string;
  branch: string;
  domain: string;
};

/** Reads the lane values, for workers as well as servers. */
export function readLaneEnv(): LaneEnv {
  return {
    project: required("DEVLANES_LANE_PROJECT"),
    lane: Number(required("DEVLANES_LANE")),
    laneName: required("DEVLANES_LANE_NAME"),
    service: required("DEVLANES_SERVICE"),
    // Set in devlanes.yaml from ${{ lane.label }} and ${{ lane.domain }}.
    branch: required("LANE_LABEL"),
    domain: required("LANE_DOMAIN"),
  };
}

/** The lane values plus what an HTTP service listens on and accepts. */
export type ServerEnv = LaneEnv & {
  port: number;
  host: string;
  /** The lane's https origins, for CORS and CSRF allow-lists. */
  origins: string[];
};

/** Reads the variables every HTTP service of the example needs. */
export function readServerEnv(): ServerEnv {
  return {
    ...readLaneEnv(),
    port: Number(required("PORT")),
    host: process.env.HOST ?? "127.0.0.1",
    origins: required("DEVLANES_ORIGINS").split(",").filter(Boolean),
  };
}

/** An API a page calls: one URL for server-side fetches, one for the links people click. */
export type ApiTarget = {
  name: string;
  url: string;
  publicUrl: string;
};

/** Reads `<PREFIX>_URL` and `<PREFIX>_PUBLIC_URL`, which the `web` template sets for each API. */
export function readApiTarget(name: string, prefix: string): ApiTarget {
  return {
    name,
    url: required(`${prefix}_URL`),
    publicUrl: required(`${prefix}_PUBLIC_URL`),
  };
}
