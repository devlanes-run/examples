import type { Kind } from "../kind.js";
import { laneInfo } from "../lane.js";
import { stats } from "../stats.js";

/** A worker that handles a batch every few seconds and logs each one. */
export const worker: Kind = {
  routes: (app) => {
    app.get("/", (c) => c.json({ ...laneInfo(c), ...stats() }));
  },
  onBurst: (count, ms) => console.log(`handled batch ${count} in ${ms} ms`),
};
