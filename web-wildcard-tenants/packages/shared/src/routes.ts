import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { env } from "./env.js";
import { hostname } from "./hosts.js";
import { laneInfo } from "./lane.js";

/** Routes every service answers: the ready check, the lane values, the request echo and the brand files. */
export const commonRoutes = new Hono();

commonRoutes.get("/healthz", (c) => c.text("ok"));
commonRoutes.get("/lane", (c) => c.json(laneInfo(c)));
// Which service got the request, for which hostname, with which cookies.
commonRoutes.get("/request", (c) =>
  c.json({ service: env.service, host: hostname(c), cookie: c.req.header("cookie") ?? null }),
);
// Each app runs from its own folder, where brand/ links to _internal/brand.
commonRoutes.use("/brand/*", serveStatic({ root: "./" }));
