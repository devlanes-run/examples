/** Every way this server can run; devlanes.yaml gives each service one through `MODE`. */
export const MODES = [
  "index",
  "crash-on-boot",
  "crash-route",
  "wrong-port",
  "never-ready",
  "proxy-loop",
  "reset",
  "upgrade",
] as const;

export type Mode = (typeof MODES)[number];

/** Reads a variable devlanes sets, failing early with a hint when the server runs outside devlanes. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; start this service with devlanes start`);
  }
  return value;
}

function isMode(value: string): value is Mode {
  return (MODES as readonly string[]).includes(value);
}

function parseMode(value: string): Mode {
  if (!isMode(value)) {
    throw new Error(`MODE is ${value}; expected one of ${MODES.join(", ")}`);
  }
  return value;
}

/** Everything this service reads from its environment, parsed once at startup. */
export const env = {
  mode: parseMode(required("MODE")),
  port: Number(required("PORT")),
  host: process.env.HOST ?? "127.0.0.1",
  project: required("DEVLANES_LANE_PROJECT"),
  lane: Number(required("DEVLANES_LANE")),
  laneName: required("DEVLANES_LANE_NAME"),
  service: required("DEVLANES_SERVICE"),
  // Set in devlanes.yaml from ${{ lane.label }} and ${{ lane.domain }}.
  branch: required("LANE_LABEL"),
  domain: required("LANE_DOMAIN"),
};

/** The proxy-loop service's own public URL, which only that mode needs. */
export function publicUrl(): string {
  return required("PUBLIC_URL");
}
