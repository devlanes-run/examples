import type { MessageStatus, NewMessage } from "@mprocs-migration/store";
import { Hono } from "hono";
import { store } from "../store.js";

const STATUSES: readonly string[] = ["queued", "sent"] satisfies MessageStatus[];

/** The message API at `/api/messages`, used by the web page, the worker and the seed script. */
export const messageRoutes = new Hono();

messageRoutes.get("/", (c) => {
  const status = c.req.query("status");
  if (status && !STATUSES.includes(status)) {
    return c.json({ error: `status must be one of ${STATUSES.join(", ")}` }, 400);
  }
  return c.json({ messages: store.list(status as MessageStatus | undefined) });
});

messageRoutes.post("/", async (c) => {
  const input = await c.req.json().catch(() => null);
  if (!isNewMessage(input)) return c.json({ error: "send JSON with to and body" }, 400);
  return c.json(store.add(input), 201);
});

messageRoutes.post("/:id/sent", (c) => {
  const id = c.req.param("id");
  const message = store.markSent(id);
  return message ? c.json(message) : c.json({ error: `no message ${id}` }, 404);
});

function isNewMessage(input: unknown): input is NewMessage {
  if (typeof input !== "object" || input === null) return false;
  const { to, body } = input as Record<string, unknown>;
  return typeof to === "string" && typeof body === "string";
}
