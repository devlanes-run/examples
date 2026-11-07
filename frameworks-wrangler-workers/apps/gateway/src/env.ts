import { env as bindings } from "cloudflare:workers";

// Workers do not see the process environment. devlanes passes these values as --var flags
// (wrangler.vars in devlanes.yaml), so they arrive as text bindings that `wrangler types` cannot
// know about.
const vars = bindings as unknown as Record<string, unknown>;

/** Reads a var devlanes passes, failing at load with a hint when the worker runs outside devlanes. */
function required(name: string): string {
  const value = vars[name];
  if (typeof value !== "string" || !value) {
    throw new Error(`${name} is not set; start this worker with devlanes start`);
  }
  return value;
}

/** Every lane value this worker reads, parsed once when the worker loads. */
export const env = {
  port: Number(required("PORT")),
  project: required("DEVLANES_LANE_PROJECT"),
  lane: Number(required("DEVLANES_LANE")),
  laneName: required("DEVLANES_LANE_NAME"),
  service: required("DEVLANES_SERVICE"),
  branch: required("LANE_LABEL"),
  domain: required("LANE_DOMAIN"),
  publicBaseUrl: required("PUBLIC_BASE_URL"),
  catalogUrl: required("CATALOG_URL"),
};
