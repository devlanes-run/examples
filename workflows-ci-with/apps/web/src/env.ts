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
  // Set in devlanes.yaml from ${{ lane.label }}.
  branch: required("LANE_LABEL"),
  // The browser calls the API, so devlanes.yaml sets this to its https hostname (public_url).
  apiUrl: required("API_URL"),
  // npm sets npm_lifecycle_event to the script it runs: dev, or start under the e2e profile.
  script: process.env.npm_lifecycle_event ?? null,
  // The e2e profile's env sets NODE_ENV=test.
  nodeEnv: process.env.NODE_ENV ?? null,
};
