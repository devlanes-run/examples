import { Hono } from "hono";
import { adminRoutes } from "../routes/admin.js";
import { commonRoutes } from "../routes/common.js";
import { listen } from "./listen.js";

/** The `admin` port: connections, ticks and recent messages as JSON at admin.<lane domain>. */
export function startAdminServer() {
  const app = new Hono()
    .route("/", commonRoutes("admin"))
    .route("/", adminRoutes)
    .notFound((c) => c.json({ error: "not found" }, 404));
  return listen(app, "admin");
}
