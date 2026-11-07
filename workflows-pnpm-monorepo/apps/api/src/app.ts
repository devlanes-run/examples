import { laneJson } from "@acme/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { accounts } from "./accounts.js";
import { env } from "./env.js";

export const app = new Hono();

// DEVLANES_ORIGINS lists this lane's https origins, so only this lane's pages get CORS headers.
app.use(cors({ origin: env.origins }));

app.get("/healthz", (c) => c.text("ok"));
app.get("/lane", (c) => c.json(laneJson(env, c.req.header("x-forwarded-host"))));
app.get("/", (c) => c.json({ ...laneJson(env, c.req.header("x-forwarded-host")), accounts }));
app.get("/api/accounts", (c) => c.json({ lane: env.lane, accounts }));
app.notFound((c) => c.json({ error: `no route for ${c.req.method} ${c.req.path}` }, 404));
