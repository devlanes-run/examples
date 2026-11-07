import { laneInfo, laneRoutes, type ApiIndex } from "@profiles-tags/shared";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { env } from "./env.js";
import { users } from "./routes/users.js";
import { listUsers, usersFile } from "./users.js";

export const app = new Hono();

app.route("/", laneRoutes(env));
app.get("/", (c) =>
  c.json({
    ...laneInfo(c, env),
    data_file: usersFile,
    records: "users",
    items: listUsers(),
  } satisfies ApiIndex),
);

app.use("/api/*", cors({ origin: env.origins }), csrf({ origin: env.origins }));
app.route("/api/users", users);
