import { env } from "../env.js";
import type { Kind } from "../kind.js";
import { laneInfo } from "../lane.js";
import { probeAll } from "../probe.js";
import { stats } from "../stats.js";
import { IndexPage } from "../views/IndexPage.js";
import { ServicePage } from "../views/ServicePage.js";

/** A page server; the one with PAGE=index lists every service of the lane instead. */
export const web: Kind = {
  routes: (app) => {
    app.get("/", async (c) => {
      const info = laneInfo(c);
      if (env.index) {
        return c.render(<IndexPage info={info} rows={await probeAll(env.index)} />);
      }
      return c.render(<ServicePage info={info} stats={stats()} />);
    });
  },
};
