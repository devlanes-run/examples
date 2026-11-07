import { Hono } from "hono";
import { env, type AppEnv } from "../env";
import { laneInfo } from "../lane";

/** `/lane` for every example, and `/api/lane` with the plugin's inspector port and state folder. */
export const lane = new Hono<AppEnv>()
  .get("/lane", (c) => c.json(laneInfo(c)))
  .get("/api/lane", (c) =>
    c.json({ ...laneInfo(c), inspector_port: env.inspectorPort, state_path: env.statePath }),
  );
