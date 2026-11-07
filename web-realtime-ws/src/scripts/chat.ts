// Sends one message to the lane's chat through the proxy and prints the echo.
// Usage: devlanes exec --name chat -- npm run chat -- <text>
import { readFileSync } from "node:fs";
import { WebSocket } from "ws";
import type { ChatMessage, ClientMessage, ServerMessage } from "../messages.js";
import { scriptEnv } from "./env.js";

const TIMEOUT_MS = 15_000;

/** Connects to wss://ws.<lane domain>, sends `text` and resolves with the matching echo. */
function sendAndWait(url: string, text: string): Promise<ChatMessage> {
  const message: ClientMessage = { id: String(Date.now()), text };
  const socket = new WebSocket(url, { ca: readFileSync(scriptEnv.caCert) });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.terminate();
      reject(new Error(`no echo from ${url} after ${TIMEOUT_MS / 1000}s`));
    }, TIMEOUT_MS);
    socket.on("error", (error) => reject(new Error(`${url}: ${error.message}`)));
    socket.on("open", () => socket.send(JSON.stringify(message)));
    socket.on("message", (data) => {
      const reply = JSON.parse(String(data)) as ServerMessage;
      if (reply.type !== "chat" || reply.id !== message.id) return;
      clearTimeout(timer);
      socket.close();
      resolve(reply);
    });
  });
}

const url = scriptEnv.publicUrl.replace(/^https:\/\//, "wss://ws.");
const text = process.argv.slice(2).join(" ") || "hello from the terminal";
const echo = await sendAndWait(url, text);
console.log(
  `lane ${echo.lane} (${echo.lane_name}) via ${echo.via}, port ${echo.port_name}: ${echo.text}`,
);
