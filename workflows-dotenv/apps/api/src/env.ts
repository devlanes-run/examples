import { appUrls } from "@example-dotenv/config";

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
  // Every https origin of this lane, for the CORS allow-list of /api/session.
  origins: required("DEVLANES_ORIGINS").split(","),
  urls: appUrls(required("APP_DOMAIN")),
  // From .env through global_env; web sends the same token, read from the same file.
  apiToken: required("ACME_API_TOKEN"),
  // Optional in devlanes.yaml, so these can be empty.
  featureFlags: (process.env.FEATURE_FLAGS ?? "")
    .split(",")
    .map((flag) => flag.trim())
    .filter(Boolean),
  sentry: Boolean(process.env.SENTRY_DSN),
};
