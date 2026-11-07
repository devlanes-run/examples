import type { CheckedService } from "./checks.js";

/** The behaviours this server can take on; devlanes.yaml picks one per service with MODE. */
export const MODES = [
  "index",
  "http",
  "tcp",
  "log",
  "own-host",
  "legacy-host",
  "slow-start",
] as const;

/** One of {@link MODES}. */
export type ModeName = (typeof MODES)[number];

/** Reads a variable devlanes sets, failing early with a hint when the server runs outside devlanes. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; start this service with devlanes start`);
  }
  return value;
}

function parseMode(value: string): ModeName {
  const mode = MODES.find((name) => name === value);
  if (!mode) {
    throw new Error(`MODE=${value} is not one of ${MODES.join(", ")}`);
  }
  return mode;
}

/** The public URL of every service the index links to. */
function serviceUrls(): Record<CheckedService, string> {
  return {
    "http-check": required("HTTP_CHECK_URL"),
    "tcp-check": required("TCP_CHECK_URL"),
    "log-check": required("LOG_CHECK_URL"),
    "own-host": required("OWN_HOST_URL"),
    "own-host-cmd": required("OWN_HOST_CMD_URL"),
    "legacy-host": required("LEGACY_HOST_URL"),
    "slow-start": required("SLOW_START_URL"),
  };
}

const mode = parseMode(required("MODE"));

/** Everything this service reads from its environment, parsed once at startup. */
export const env = {
  port: Number(required("PORT")),
  host: process.env.HOST ?? "127.0.0.1",
  project: required("DEVLANES_LANE_PROJECT"),
  lane: Number(required("DEVLANES_LANE")),
  laneName: required("DEVLANES_LANE_NAME"),
  service: required("DEVLANES_SERVICE"),
  // Set in devlanes.yaml from ${{ lane.label }}, ${{ lane.domain }} and the index's public_url.
  branch: required("LANE_LABEL"),
  domain: required("LANE_DOMAIN"),
  indexUrl: required("INDEX_URL"),
  mode,
  // Only own-host needs its hostname, from ${{ self.hosts[0] }}.
  allowedHost: mode === "own-host" ? required("ALLOWED_HOST") : null,
  serviceUrls: mode === "index" ? serviceUrls() : null,
};
