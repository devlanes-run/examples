import type { Kind } from "../kind.js";
import { laneInfo } from "../lane.js";
import { stats } from "../stats.js";

const orders = [
  { id: 1, customer: "Ada Acme", total: "49.00 EUR" },
  { id: 2, customer: "Grace Acme", total: "12.50 EUR" },
  { id: 3, customer: "Linus Acme", total: "7.90 EUR" },
];

/** A JSON API: `/` answers with the lane values, its stats and a few orders. */
export const api: Kind = {
  routes: (app) => {
    app.get("/", (c) => c.json({ ...laneInfo(c), ...stats(), orders }));
    app.get("/api/orders", (c) => c.json(orders));
  },
};
