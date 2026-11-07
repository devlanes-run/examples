import { laneInfo } from "@mprocs-migration/shared";
import { Hono } from "hono";
import { env } from "./env.js";
import { Inbox } from "./inbox.js";

const inbox = new Inbox();

export const app = new Hono();

app.get("/healthz", (c) => c.text("ok"));
app.get("/lane", (c) => c.json(laneInfo(c, env)));
app.get("/", (c) => c.json({ ...laneInfo(c, env), messages: inbox.list() }));
app.get("/messages", (c) => c.json({ messages: inbox.list() }));

app.post("/messages", async (c) => {
  const input: unknown = await c.req.json().catch(() => null);
  const { to, body, from_lane } = (input ?? {}) as Record<string, unknown>;
  if (typeof to !== "string" || typeof body !== "string") {
    return c.json({ error: "send JSON with to and body" }, 400);
  }
  const sms = inbox.receive({
    to,
    body,
    from_lane: typeof from_lane === "number" ? from_lane : null,
  });
  console.log(`${sms.id} to ${sms.to} from lane ${sms.from_lane}`);
  return c.json(sms, 201);
});

app.notFound((c) => c.json({ error: `no route for ${c.req.method} ${c.req.path}` }, 404));
