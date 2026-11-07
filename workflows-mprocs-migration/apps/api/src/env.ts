import { laneEnv } from "@mprocs-migration/shared";
import { fileURLToPath } from "node:url";

/**
 * Everything the api, migrate and seed read from their environment, parsed once at startup.
 * Every value has the default the mprocs setup in `before/` relied on.
 */
export const env = {
  // The api reads its own variable; devlanes.yaml sets API_PORT: ${{ self.port }}.
  port: Number(process.env.API_PORT ?? 4000),
  host: process.env.HOST ?? "127.0.0.1",
  ...laneEnv(process.env),
  // devlanes sets DATA_FILE to a file in the lane's data folder. Under mprocs each worktree
  // had its own .data/acme.json at the example root.
  dataFile:
    process.env.DATA_FILE ?? fileURLToPath(new URL("../../../.data/acme.json", import.meta.url)),
  // The seed script posts through the running api.
  apiUrl: process.env.API_URL ?? "http://127.0.0.1:4000",
};
