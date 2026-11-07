import { laneInfo } from "@mprocs-migration/shared";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { env } from "./env.js";
import { messageRoutes } from "./routes/messages.js";
import { store } from "./store.js";

const missingDataFile = `no ${env.dataFile}, run migrate`;

// Everything but /healthz and /lane needs the file migrate creates.
const requireDataFile = createMiddleware(async (c, next) => {
  if (!store.exists()) return c.json({ error: missingDataFile }, 503);
  await next();
});

export const app = new Hono();

// Not ready until migrate has created the data file, so the start waits for the task.
app.get("/healthz", (c) => (store.exists() ? c.text("ok") : c.text(missingDataFile, 503)));
app.get("/lane", (c) => c.json(laneInfo(c, env)));

app.get("/", requireDataFile, (c) =>
  c.json({ ...laneInfo(c, env), data_file: env.dataFile, messages: store.list() }),
);
app.use("/api/*", requireDataFile);
app.route("/api/messages", messageRoutes);

app.notFound((c) => c.json({ error: `no route for ${c.req.method} ${c.req.path}` }, 404));
