import { createServer } from "node:http";
import { laneInfo, readJson, sendJson, sendText } from "./lib.mjs";
import { dataFile, exists, load, save } from "./db/store.mjs";

// The app reads its own variable with the port it always had as the default.
// devlanes.yaml passes the lane's port in as API_PORT: ${{ self.port }}.
const port = Number(process.env.API_PORT ?? 4000);
const host = process.env.HOST ?? "127.0.0.1";

const server = createServer(async (req, res) => {
  const { pathname, searchParams } = new URL(req.url, "http://localhost");
  const route = `${req.method} ${pathname}`;

  if (route === "GET /healthz") {
    // Not ready until migrate has created the data file.
    return exists() ? sendText(res, 200, "ok") : sendText(res, 503, `no ${dataFile}, run migrate`);
  }
  if (route === "GET /lane") return sendJson(res, 200, laneInfo(req, port));
  if (!exists()) return sendJson(res, 503, { error: `no ${dataFile}, run migrate` });

  const data = load();
  if (route === "GET /") {
    return sendJson(res, 200, {
      ...laneInfo(req, port),
      data_file: dataFile,
      messages: data.messages,
    });
  }
  if (route === "GET /api/messages") {
    const status = searchParams.get("status");
    const messages = status ? data.messages.filter((m) => m.status === status) : data.messages;
    return sendJson(res, 200, { messages });
  }
  if (route === "POST /api/messages") {
    const input = await readJson(req);
    if (typeof input?.to !== "string" || typeof input?.body !== "string") {
      return sendJson(res, 400, { error: "send JSON with to and body" });
    }
    const message = {
      id: `msg_${data.next_id++}`,
      to: input.to,
      body: input.body,
      status: "queued",
    };
    data.messages.push(message);
    save(data);
    return sendJson(res, 201, message);
  }
  const sent = route.match(/^POST \/api\/messages\/([\w-]+)\/sent$/);
  if (sent) {
    const message = data.messages.find((m) => m.id === sent[1]);
    if (!message) return sendJson(res, 404, { error: `no message ${sent[1]}` });
    message.status = "sent";
    message.sent_at = new Date().toISOString();
    save(data);
    return sendJson(res, 200, message);
  }
  sendJson(res, 404, { error: `no route for ${route}` });
});

server.listen(port, host, () => {
  console.log(`api listening on http://${host}:${port}, data in ${dataFile}`);
});
