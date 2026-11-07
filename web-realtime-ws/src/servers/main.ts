import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { rooms } from "../realtime/chat.js";
import { chatRoutes } from "../routes/chat.js";
import { commonRoutes } from "../routes/common.js";
import { eventsRoutes } from "../routes/events.js";
import { pageRoutes } from "../routes/page.js";
import { listen } from "./listen.js";

/** The main port (`PORT`): the page, SSE on `/events` and a WebSocket on `/ws`. */
export function startMainServer() {
  const app = new Hono()
    .route("/", commonRoutes("default"))
    .route("/events", eventsRoutes)
    // The same hostname as the page takes upgrades too, on /ws.
    .route("/ws", chatRoutes(rooms.default))
    // brand/ links to _internal/brand, the CSS and logo every example shares.
    .use("/brand/*", serveStatic({ root: "./" }))
    // `vite build` writes the browser code to dist/client before the server starts.
    .use("/client/*", serveStatic({ root: "./dist" }))
    .route("/", pageRoutes);
  return listen(app, "default", { websocket: true });
}
