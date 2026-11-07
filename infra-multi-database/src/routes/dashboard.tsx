import { Hono } from "hono";
import { laneInfo } from "../lane.js";
import { checkAll } from "../stores/index.js";
import { DashboardPage } from "../views/DashboardPage.js";

/** `GET /`: the lane and every store's health. */
export const dashboard = new Hono().get("/", async (c) =>
  c.render(<DashboardPage info={laneInfo(c)} health={await checkAll()} />),
);
