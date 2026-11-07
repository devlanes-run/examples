import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

const env = process.env;

// A Worker cannot read process.env, so the lane values reach it as vars.
const laneVars = {
  DEVLANES_LANE_PROJECT: env.DEVLANES_LANE_PROJECT,
  DEVLANES_LANE: env.DEVLANES_LANE,
  DEVLANES_LANE_NAME: env.DEVLANES_LANE_NAME,
  DEVLANES_SERVICE: env.DEVLANES_SERVICE,
  LANE_LABEL: env.LANE_LABEL,
  PORT: env.PORT,
  INSPECTOR_PORT: env.INSPECTOR_PORT,
};

// Outside devlanes, fall back to the plugin's defaults: port 9229 and .wrangler/state.
const statePath = env.DEVLANES_LANE_DATA && `${env.DEVLANES_LANE_DATA}/cloudflare-state`;

export default defineConfig({
  plugins: [
    react(),
    cloudflare({
      inspectorPort: env.INSPECTOR_PORT ? Number(env.INSPECTOR_PORT) : undefined,
      // .wrangler/state sits in the worktree, so two lanes of one folder would
      // share one KV store. The lane data folder is per lane.
      persistState: statePath ? { path: statePath } : true,
      config: {
        vars: Object.fromEntries(
          Object.entries({ ...laneVars, STATE_PATH: statePath }).filter(([, value]) => value),
        ),
      },
    }),
  ],
});
