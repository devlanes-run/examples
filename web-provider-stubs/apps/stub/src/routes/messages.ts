import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { env } from "../env.js";
import type { Inbox } from "../inbox.js";

// Senders authenticate like they would with the real provider.
const requireApiKey = createMiddleware(async (c, next) => {
  if (c.req.header("authorization") !== `Bearer ${env.apiKey}`) {
    return c.json({ error: "invalid_api_key", message: "send Authorization: Bearer <key>" }, 401);
  }
  await next();
});

/** The provider API at `/v1/messages`: accept a message, or list the inbox. */
export function messageRoutes(inbox: Inbox): Hono {
  const routes = new Hono();

  routes.post("/", requireApiKey, async (c) => {
    let input: unknown;
    try {
      input = await c.req.json();
    } catch {
      return c.json({ error: "invalid_request", message: "body is not valid JSON" }, 400);
    }
    const fields =
      typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
    const result = inbox.receive(fields);
    if (!result.ok) {
      return c.json(
        { error: "invalid_request", message: `missing ${result.missing.join(", ")}` },
        400,
      );
    }
    console.log(`${result.message.id} to ${result.message.to}`);
    return c.json({ ...result.message, status: "accepted" }, 201);
  });

  routes.get("/", (c) => c.json({ messages: inbox.list() }));

  return routes;
}
