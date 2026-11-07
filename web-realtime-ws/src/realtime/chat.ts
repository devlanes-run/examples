import type { WSContext, WSEvents, WSMessageReceive } from "hono/ws";
import { env, type PortName } from "../env.js";
import type { ChatMessage, ConnectionTag, HelloMessage } from "../messages.js";

const RECENT_LIMIT = 20;
const TEXT_LIMIT = 500;
const OPEN = 1;

/** Messages across both rooms, for the admin view. */
export const history = {
  total: 0,
  recent: [] as ChatMessage[],
};

/** Reads `{ id, text }` from a frame, treating anything that is not that JSON as plain text. */
function parseFrame(data: WSMessageReceive): { id: string | null; text: string } {
  const raw = typeof data === "string" ? data : "";
  try {
    const { id, text } = JSON.parse(raw) as { id?: unknown; text?: unknown };
    return { id: typeof id === "string" ? id : null, text: String(text ?? "") };
  } catch {
    return { id: null, text: raw };
  }
}

/** The sockets connected through one port, each echo going to all of them. */
export class ChatRoom {
  readonly #clients = new Set<WSContext>();

  constructor(readonly portName: PortName) {}

  /** Open sockets in this room. */
  get size(): number {
    return this.#clients.size;
  }

  /** WebSocket handlers for one connection that reached this port through hostname `via`. */
  connect(via: string): WSEvents {
    const tag: ConnectionTag = {
      lane: env.lane,
      lane_name: env.laneName,
      via,
      port_name: this.portName,
      port: env.ports[this.portName],
    };
    return {
      onOpen: (_event, ws) => {
        this.#clients.add(ws);
        const hello: HelloMessage = { type: "hello", ...tag };
        ws.send(JSON.stringify(hello));
      },
      onMessage: (event) => {
        const { id, text } = parseFrame(event.data);
        const at = new Date().toISOString();
        this.#broadcast({ type: "chat", ...tag, id, text: text.slice(0, TEXT_LIMIT), at });
      },
      onClose: (_event, ws) => {
        this.#clients.delete(ws);
      },
    };
  }

  #broadcast(message: ChatMessage): void {
    history.total += 1;
    history.recent.push(message);
    if (history.recent.length > RECENT_LIMIT) history.recent.shift();
    const frame = JSON.stringify(message);
    for (const client of this.#clients) {
      if (client.readyState === OPEN) client.send(frame);
    }
  }
}

/** One room per port that takes WebSockets, so the page can show which one echoed. */
export const rooms = {
  default: new ChatRoom("default"),
  ws: new ChatRoom("ws"),
};
