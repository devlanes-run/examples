import { Hono } from "hono";
import { databaseEnv, serverEnv } from "../env.js";
import { addOrder, listOrders, parseNewOrder } from "../orders.js";

/** `GET /api/orders` lists the lane's orders; `POST /api/orders` adds one. */
export const orderRoutes = new Hono()
  .get("/", async (c) =>
    c.json({
      lane: serverEnv().lane,
      database: databaseEnv().name,
      orders: await listOrders(),
    }),
  )
  .post("/", async (c) => {
    const order = parseNewOrder(await c.req.json().catch(() => null));
    if (!order) {
      return c.json({ error: "expected { customer, item, total_cents }" }, 400);
    }
    return c.json(await addOrder(order), 201);
  });
