import { Hono } from "hono";
import type { AppEnv } from "./env";
import { counter } from "./routes/counter";
import { items } from "./routes/items";
import { lane } from "./routes/lane";

const app = new Hono<AppEnv>();

app.get("/healthz", (c) => c.text("ok"));
app.route("/", lane);
app.route("/api/items", items);
app.route("/api/counter", counter);
app.notFound((c) => c.json({ error: `no route for ${c.req.path}` }, 404));

export default app;
