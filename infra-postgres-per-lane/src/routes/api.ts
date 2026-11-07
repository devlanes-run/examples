import { Hono } from "hono";
import { laneInfo } from "../lane.js";
import { loadState } from "../state.js";

/** JSON routes: the lane values together with what the lane's Postgres and Redis hold. */
export const api = new Hono();

api.get("/state", async (c) => c.json({ ...laneInfo(c), ...(await loadState()) }));
