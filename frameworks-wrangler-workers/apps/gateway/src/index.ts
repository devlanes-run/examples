import { Hono } from "hono";
import { laneInfo } from "./lane.js";
import { apiRoutes } from "./routes/api.js";
import { pageRoutes } from "./routes/pages.js";

// /brand/* never reaches this app: wrangler serves it from the assets directory first.
const app = new Hono<{ Bindings: Env }>();

app.get("/healthz", (c) => c.text("ok"));
app.get("/lane", (c) => c.json(laneInfo(c)));
app.route("/api", apiRoutes);
app.route("/", pageRoutes);

app.notFound((c) => c.json({ error: "not_found" }, 404));

export default app;
