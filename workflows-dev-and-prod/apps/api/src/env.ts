/** Reads a variable devlanes sets, failing early with a hint when the server runs outside devlanes. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; start this service with devlanes start`);
  }
  return value;
}

/** Everything this service reads from its environment, parsed once at startup. */
export const env = {
  port: Number(required("PORT")),
  host: process.env.HOST ?? "127.0.0.1",
  project: required("DEVLANES_LANE_PROJECT"),
  lane: Number(required("DEVLANES_LANE")),
  laneName: required("DEVLANES_LANE_NAME"),
  service: required("DEVLANES_SERVICE"),
  // Set in devlanes.yaml from ${{ lane.label }} and ${{ lane.domain }}.
  branch: required("LANE_LABEL"),
  domain: required("LANE_DOMAIN"),
  // This lane's origins only, so another lane's page gets no CORS headers.
  origins: required("DEVLANES_ORIGINS").split(",").filter(Boolean),
  // npm sets this to the script it runs, so it shows whether a profile swapped dev for start.
  script: process.env.npm_lifecycle_event ?? null,
  // NODE_ENV and APP_PROFILE come from the profile, PROJECT_FILE from global_env.
  nodeEnv: process.env.NODE_ENV ?? null,
  profile: process.env.APP_PROFILE ?? null,
  projectFile: required("PROJECT_FILE"),
  // devlanes.local.example.yaml sets LOG_LEVEL=debug.
  logLevel: process.env.LOG_LEVEL ?? "info",
};
