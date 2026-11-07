// A fake SMS provider. Clients outside this repository are configured with
// http://127.0.0.1:4010, so it listens there in every setup.
import { createServer } from "node:http";
import { laneInfo, readJson, sendJson, sendText } from "./lib.mjs";

const port = Number(process.env.PORT ?? 4010);
const host = process.env.HOST ?? "127.0.0.1";

// In memory: stopping the stub empties its inbox.
const messages = [];

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  const route = `${req.method} ${pathname}`;

  if (route === "GET /healthz") return sendText(res, 200, "ok");
  if (route === "GET /lane") return sendJson(res, 200, laneInfo(req, port));
  if (route === "GET /") return sendJson(res, 200, { ...laneInfo(req, port), messages });
  if (route === "GET /messages") return sendJson(res, 200, { messages });
  if (route === "POST /messages") {
    const input = await readJson(req);
    if (typeof input?.to !== "string" || typeof input?.body !== "string") {
      return sendJson(res, 400, { error: "send JSON with to and body" });
    }
    const message = {
      id: `sms_${messages.length + 1}`,
      to: input.to,
      body: input.body,
      // The sender's lane, so a message from another lane stands out.
      from_lane: input.from_lane ?? null,
      received_at: new Date().toISOString(),
    };
    messages.push(message);
    console.log(`${message.id} to ${message.to} from lane ${message.from_lane}`);
    return sendJson(res, 201, message);
  }
  sendJson(res, 404, { error: `no route for ${route}` });
});

server.listen(port, host, () => {
  console.log(`sms-stub listening on http://${host}:${port}`);
});
