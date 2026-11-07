/** One Server-Sent Event from `/events`. */
export type Tick = {
  lane: number;
  tick: number;
  time: string;
};

/** Where a WebSocket connection came in: the lane, the hostname and the named port. */
export type ConnectionTag = {
  lane: number;
  lane_name: string;
  via: string;
  port_name: string;
  port: number;
};

/** The first frame a chat socket receives after it opens. */
export type HelloMessage = ConnectionTag & { type: "hello" };

/** A chat message echoed to every socket in the room, tagged with the sender's connection. */
export type ChatMessage = ConnectionTag & {
  type: "chat";
  id: string | null;
  text: string;
  at: string;
};

/** Any frame the server sends on a chat socket. */
export type ServerMessage = HelloMessage | ChatMessage;

/** The frame a client sends; `id` lets it match the echo to what it sent. */
export type ClientMessage = {
  id: string;
  text: string;
};
