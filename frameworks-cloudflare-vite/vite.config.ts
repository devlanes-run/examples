import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const env = process.env;

// .wrangler/state sits in the worktree, so two lanes of one folder would share one KV store.
// The lane data folder belongs to one lane. `vite build` runs outside devlanes and has neither.
const statePath = env.DEVLANES_LANE_DATA && `${env.DEVLANES_LANE_DATA}/cloudflare-state`;

// A Worker cannot read process.env, so the lane values reach it as the vars wrangler.jsonc declares.
const laneVars = {
  DEVLANES_LANE_PROJECT: env.DEVLANES_LANE_PROJECT,
  DEVLANES_LANE: env.DEVLANES_LANE,
  DEVLANES_LANE_NAME: env.DEVLANES_LANE_NAME,
  DEVLANES_SERVICE: env.DEVLANES_SERVICE,
  LANE_LABEL: env.LANE_LABEL,
  PORT: env.PORT,
  INSPECTOR_PORT: env.INSPECTOR_PORT,
  STATE_PATH: statePath,
};

export default defineConfig({
  plugins: [
    react(),
    cloudflare({
      // Without a port the plugin takes 9229, or the next free one when another lane holds it,
      // and inspect.<lane domain> would route to a port devlanes did not allocate.
      inspectorPort: env.INSPECTOR_PORT ? Number(env.INSPECTOR_PORT) : undefined,
      persistState: statePath ? { path: statePath } : true,
      config: {
        vars: Object.fromEntries(
          Object.entries(laneVars).filter((entry): entry is [string, string] => !!entry[1]),
        ),
      },
    }),
  ],
  // brand/ is a link to _internal/brand; resolving it would put the CSS outside the app's root.
  resolve: { preserveSymlinks: true },
});
