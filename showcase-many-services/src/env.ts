/** The kinds of service this server can be; devlanes.yaml picks one per template with KIND. */
export const KINDS = ["api", "web", "worker", "job"] as const;

/** One of {@link KINDS}. */
export type KindName = (typeof KINDS)[number];

/** A span of milliseconds that each boot or burst picks a random length from. */
export type Range = { min: number; max: number };

/** A service the index page asks for `/stats`. */
export type Target = {
  name: string;
  /** Lane-internal address the index fetches from. */
  url: string;
  /** Address the page links to: the hostname when the service has one, else its port. */
  link: string;
};

/** Reads a variable devlanes sets, failing early with a hint when the server runs outside devlanes. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; start this service with devlanes start`);
  }
  return value;
}

function parseKind(value: string): KindName {
  const kind = KINDS.find((name) => name === value);
  if (!kind) {
    throw new Error(`KIND=${value} is not one of ${KINDS.join(", ")}`);
  }
  return kind;
}

/** Parses `1000-6000` (or a single `500`) into a range. */
function parseRange(name: string): Range {
  const value = required(name);
  const [min, max = min] = value.split("-").map(Number);
  if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
    throw new Error(`${name}=${value} is not a range of milliseconds such as 1000-6000`);
  }
  return { min, max };
}

/** The services listed in SERVICES, each with the URL_<NAME> and PUBLIC_URL_<NAME> generate.ts writes. */
function targets(): Target[] {
  return required("SERVICES")
    .split(",")
    .map((name) => {
      const key = name.toUpperCase().replace(/[^A-Z0-9]/g, "_");
      const url = required(`URL_${key}`);
      return { name, url, link: process.env[`PUBLIC_URL_${key}`] ?? url };
    });
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
  kind: parseKind(required("KIND")),
  boot: parseRange("BOOT_MS"),
  burst: parseRange("BURST_MS"),
  burstEvery: parseRange("BURST_EVERY_MS"),
  // Only the index service sets PAGE=index and gets the list of every service.
  index: process.env.PAGE === "index" ? targets() : null,
};
