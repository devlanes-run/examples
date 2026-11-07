import { Hono } from "hono";
import { laneInfo } from "../lane.js";
import { checkAll, runDemo, stores } from "../stores/index.js";
import { DashboardPage } from "../views/DashboardPage.js";

/** `POST /stores/<store>/try` for each store: runs its write-then-read and shows the dashboard with the output. */
export const storeActions = new Hono();

for (const store of stores) {
  storeActions.post(`/${store.key}/try`, async (c) => {
    const result = await runDemo(store);
    // Health runs after the demo, so counts on the card include the write.
    const health = await checkAll();
    return c.render(
      <DashboardPage info={laneInfo(c)} health={health} tried={{ key: store.key, result }} />,
    );
  });
}
