import { Hono } from "hono";
import { items } from "./items.js";
import { laneInfo } from "./lane.js";
import { itemRoutes } from "./routes/items.js";

const app = new Hono<{ Bindings: Env }>();

app.get("/healthz", (c) => c.text("ok"));
app.get("/lane", (c) => c.json(laneInfo(c)));
app.get("/", (c) => c.json({ ...laneInfo(c), items }));
app.route("/api", itemRoutes);

app.notFound((c) => c.json({ error: "not_found" }, 404));

export default app;
