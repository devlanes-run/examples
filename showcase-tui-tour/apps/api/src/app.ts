import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { databaseEnv } from "./env.js";
import { laneInfo } from "./lane.js";
import { laneOrigins, requestLog } from "./middleware.js";
import { listOrders } from "./orders.js";
import { mailRoutes } from "./routes/mail.js";
import { orderRoutes } from "./routes/orders.js";

export const app = new Hono();

app.use(requestLog(), ...laneOrigins());

app.get("/healthz", (c) => c.text("ok"));
app.get("/lane", (c) => c.json(laneInfo(c)));
app.get("/", async (c) =>
  c.json({ ...laneInfo(c), database: databaseEnv().name, orders: await listOrders() }),
);

app.route("/api/orders", orderRoutes);
app.route("/api/mail", mailRoutes);

app.notFound((c) => c.json({ error: `no route for ${c.req.method} ${c.req.path}` }, 404));
// A stopped Postgres or Redis shows up on the page as this error instead of a hung request.
app.onError((err, c) =>
  err instanceof HTTPException ? err.getResponse() : c.json({ error: err.message }, 500),
);
