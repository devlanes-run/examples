import { Hono } from "hono";
import { addUser, listUsers } from "../users.js";

/** `/api/users`: the users the shop signs up and the mailer polls. */
export const users = new Hono()
  .get("/", (c) => c.json(listUsers()))
  .post("/", async (c) => {
    const body = await c.req.json<{ name?: unknown }>().catch(() => ({ name: undefined }));
    const name = typeof body.name === "string" && body.name.trim();
    return c.json(addUser(name || undefined), 201);
  });
