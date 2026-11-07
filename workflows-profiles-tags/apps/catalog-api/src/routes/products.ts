import { Hono } from "hono";
import { addProduct, listProducts } from "../products.js";

/** `/api/products`: what the shop lists and staff add in admin-web. */
export const products = new Hono()
  .get("/", (c) => c.json(listProducts()))
  .post("/", async (c) => {
    const body = await c.req.json<{ name?: unknown }>().catch(() => ({ name: undefined }));
    const name = typeof body.name === "string" && body.name.trim();
    return c.json(addProduct(name || undefined), 201);
  });
