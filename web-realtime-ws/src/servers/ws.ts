import { Hono } from "hono";
import { env } from "../env.js";
import { rooms } from "../realtime/chat.js";
import { chatRoutes } from "../routes/chat.js";
import { commonRoutes } from "../routes/common.js";
import { listen } from "./listen.js";

/** The `ws` port: the chat's WebSocket on any path, reached through ws.<lane domain>. */
export function startWsServer() {
  const app = new Hono()
    .route("/", commonRoutes("ws"))
    .route("/", chatRoutes(rooms.ws))
    .get("*", (c) =>
      c.text(`WebSocket endpoint of lane ${env.lane}: connect with wss://ws.${env.domain}\n`, 426),
    );
  return listen(app, "ws", { websocket: true });
}
