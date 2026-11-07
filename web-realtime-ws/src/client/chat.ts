import type { ClientMessage, ServerMessage } from "../messages.js";
import { byId, setState } from "./dom.js";

type Route = "ws" | "default";

const RETRY_MS = 2000;

// One socket to the ws port's own hostname, one to /ws on this page's hostname. location.host
// keeps the proxy's port when it fell back to 8443.
const urls: Record<Route, string> = {
  ws: `wss://ws.${location.host}`,
  default: `wss://${location.host}/ws`,
};

const sockets = new Map<Route, WebSocket>();
// Send times by message id, for the round trip shown next to each echo.
const pending = new Map<string, number>();

function print(line: string): void {
  const log = byId("log");
  log.textContent = `${line}\n${log.textContent}`;
}

function showEcho(message: ServerMessage): void {
  if (message.type !== "chat") return;
  const sentAt = message.id ? pending.get(message.id) : undefined;
  if (message.id) pending.delete(message.id);
  const trip = sentAt ? ` (round trip ${Date.now() - sentAt} ms)` : "";
  print(
    `lane ${message.lane} via ${message.via}, port ${message.port_name}: ${message.text}${trip}`,
  );
}

function connect(route: Route): void {
  const state = byId(`state-${route}`);
  const socket = new WebSocket(urls[route]);
  sockets.set(route, socket);
  socket.onopen = () => setState(state, `open: ${urls[route]}`, true);
  socket.onclose = () => {
    setState(state, `closed: ${urls[route]}, retrying`, false);
    setTimeout(() => connect(route), RETRY_MS);
  };
  socket.onmessage = (event: MessageEvent<string>) => {
    showEcho(JSON.parse(event.data) as ServerMessage);
  };
}

function send(event: SubmitEvent): void {
  event.preventDefault();
  const input = byId<HTMLInputElement>("text");
  const route = byId<HTMLSelectElement>("via").value as Route;
  const socket = sockets.get(route);
  const text = input.value.trim();
  if (!text || socket?.readyState !== WebSocket.OPEN) return;
  const message: ClientMessage = { id: crypto.randomUUID(), text };
  pending.set(message.id, Date.now());
  socket.send(JSON.stringify(message));
  input.value = "";
}

/** Opens both chat sockets, reconnecting when one closes, and sends the form over the chosen one. */
export function startChat(): void {
  connect("ws");
  connect("default");
  byId<HTMLFormElement>("chat").addEventListener("submit", send);
}
