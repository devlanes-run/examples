import { Hono } from "hono";
import { mailState, queueMail } from "../mail.js";

const DEFAULT_TO = "dev@example.invalid";

/** `GET /api/mail` shows the lane's queue and sent mail; `POST /api/mail` queues a mail. */
export const mailRoutes = new Hono()
  .get("/", async (c) => c.json(await mailState()))
  .post("/", async (c) => {
    const body: unknown = await c.req.json().catch(() => ({}));
    const to = typeof body === "object" && body !== null && "to" in body ? body.to : undefined;
    return c.json(await queueMail(typeof to === "string" && to ? to : DEFAULT_TO), 202);
  });
