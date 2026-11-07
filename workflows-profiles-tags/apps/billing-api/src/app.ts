import { laneInfo, laneRoutes, type ApiIndex } from "@profiles-tags/shared";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { env } from "./env.js";
import { invoicesFile, listInvoices } from "./invoices.js";
import { invoices } from "./routes/invoices.js";

export const app = new Hono();

app.route("/", laneRoutes(env));
app.get("/", (c) =>
  c.json({
    ...laneInfo(c, env),
    data_file: invoicesFile,
    records: "invoices",
    items: listInvoices(),
  } satisfies ApiIndex),
);

app.use("/api/*", cors({ origin: env.origins }), csrf({ origin: env.origins }));
app.route("/api/invoices", invoices);
