import { resolve } from "node:path";
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
  urls: appUrls(required("APP_DOMAIN")),
  // From .env through global_env; the api checks it against its own copy.
  apiToken: required("ACME_API_TOKEN"),
  sentry: Boolean(process.env.SENTRY_DSN),
  dotenv: {
    // npm runs the dev script in apps/web, two folders below devlanes.yaml and its .env.
    projectDir: resolve("../.."),
    lanePath: required("LANE_PATH"),
    primaryPath: required("DOTENV_ROOT"),
  },
  // A copy of the whole environment, so the page can say which .env keys reached this process.
  vars: { ...process.env },
};
