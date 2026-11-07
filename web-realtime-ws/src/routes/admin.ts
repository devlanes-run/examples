import { Hono } from "hono";
import { env } from "../env.js";
import { laneInfo } from "../lane.js";
import { history, rooms } from "../realtime/chat.js";
import { ticker } from "../realtime/ticker.js";

const startedAt = Date.now();

/** `GET /` on the admin port: the lane values plus the process's open connections and messages. */
export const adminRoutes = new Hono().get("/", (c) =>
  c.json({
    ...laneInfo(c, "admin"),
    ports: env.ports,
    hosts: { default: env.domain, ws: `ws.${env.domain}`, admin: `admin.${env.domain}` },
    uptime_s: Math.round((Date.now() - startedAt) / 1000),
    connections: {
      sse: ticker.subscribers,
      ws_port: rooms.ws.size,
      main_port_ws: rooms.default.size,
    },
    sse_ticks: ticker.count,
    messages: history.total,
    recent: history.recent,
  }),
);
