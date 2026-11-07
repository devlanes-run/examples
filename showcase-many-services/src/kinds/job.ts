import type { Kind } from "../kind.js";
import { laneInfo } from "../lane.js";
import { stats } from "../stats.js";

/** A job that runs a longer task now and then and logs each run. */
export const job: Kind = {
  routes: (app) => {
    app.get("/", (c) => c.json({ ...laneInfo(c), ...stats() }));
  },
  onBurst: (count, ms) => console.log(`run ${count} took ${ms} ms`),
};
