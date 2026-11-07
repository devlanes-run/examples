import { upgradeWebSocket } from "@hono/node-server";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { env } from "../env.js";
import type { ChatRoom } from "../realtime/chat.js";

// CORS does not cover WebSockets, so a page on another origin could open one with the user's
// cookies. Browsers always send Origin on an upgrade; tools such as chat.ts send none.
const allowedOrigin = createMiddleware(async (c, next) => {
  const origin = c.req.header("origin");
  if (origin && !env.origins.includes(origin)) {
    return c.text(`origin ${origin} is not in DEVLANES_ORIGINS`, 403);
  }
  await next();
});

/** WebSocket upgrades on any path below the mount point join `room`; other requests fall through. */
export function chatRoutes(room: ChatRoom): Hono {
  return new Hono().get(
    "*",
    allowedOrigin,
    upgradeWebSocket((c) => {
      const via = c.req.header("x-forwarded-host") ?? c.req.header("host") ?? "unknown";
      return room.connect(via);
    }),
  );
}
