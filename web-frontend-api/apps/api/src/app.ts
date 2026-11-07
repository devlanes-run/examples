import { Hono } from "hono";
import { laneCors } from "./cors.js";
import { items } from "./items.js";
import { laneInfo } from "./lane.js";
import { itemRoutes } from "./routes/items.js";
import { sessionRoutes } from "./routes/session.js";

export const app = new Hono();

app.use(laneCors());

app.get("/healthz", (c) => c.text("ok"));
app.get("/lane", (c) => c.json(laneInfo(c)));
app.get("/", (c) => c.json({ ...laneInfo(c), items }));

app.route("/api/items", itemRoutes);
app.route("/api", sessionRoutes);
