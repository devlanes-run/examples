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
  // Every https origin of this lane; form posts from anywhere else are refused.
  origins: required("DEVLANES_ORIGINS").split(",").filter(Boolean),
  // Set in devlanes.yaml: REDIS_URL from the shared container's port, QUEUE_PREFIX from lanes.vars.
  redisUrl: required("REDIS_URL"),
  queuePrefix: required("QUEUE_PREFIX"),
};
