import { Hono } from "hono";
import { laneInfo } from "../lane.js";
import { loadState } from "../state.js";
import { HomePage } from "../views/HomePage.js";

/** The page with the lane, its Postgres and its Redis database. */
export const pages = new Hono();

pages.get("/", async (c) => c.render(<HomePage info={laneInfo(c)} state={await loadState()} />));
