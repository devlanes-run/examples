import { env as bindings } from "cloudflare:workers";

/** The Hono environment of this Worker: the bindings `wrangler types` generated from wrangler.jsonc. */
export type AppEnv = { Bindings: Env };

/** Reads a var vite.config.ts copies from the lane, failing early when Vite runs outside devlanes. */
function required(name: keyof Env & string): string {
  const value = bindings[name];
  if (typeof value !== "string" || !value) {
    throw new Error(`${name} is not set; start this service with devlanes start`);
  }
  return value;
}

/** Every var this Worker reads, parsed once when workerd loads it. */
export const env = {
  project: required("DEVLANES_LANE_PROJECT"),
  lane: Number(required("DEVLANES_LANE")),
  laneName: required("DEVLANES_LANE_NAME"),
  service: required("DEVLANES_SERVICE"),
  // Set in devlanes.yaml from ${{ lane.label }}.
  branch: required("LANE_LABEL"),
  port: Number(required("PORT")),
  inspectorPort: Number(required("INSPECTOR_PORT")),
  statePath: required("STATE_PATH"),
};
