import { Hono } from "hono";
import { addInvoice, listInvoices } from "../invoices.js";

/** `/api/invoices`: the invoices staff see and create in admin-web. */
export const invoices = new Hono()
  .get("/", (c) => c.json(listInvoices()))
  .post("/", async (c) => {
    const body = await c.req.json<{ customer?: unknown }>().catch(() => ({ customer: undefined }));
    const customer = typeof body.customer === "string" && body.customer.trim();
    return c.json(addInvoice(customer || undefined), 201);
  });
