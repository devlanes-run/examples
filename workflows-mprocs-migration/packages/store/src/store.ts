import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Message, MessageStatus, NewMessage, StoreData } from "./types.js";

/** The schema version `migrate` brings the data file to. */
export const SCHEMA = 2;

/**
 * The messages in one JSON file. Every call reads or writes the whole file, so the api and the
 * migrate script never hold stale copies.
 */
export class MessageStore {
  constructor(readonly path: string) {}

  /** Whether `migrate` has created the file. */
  exists(): boolean {
    return existsSync(this.path);
  }

  /** Reads the file as it is on disk. */
  read(): StoreData {
    return JSON.parse(readFileSync(this.path, "utf8")) as StoreData;
  }

  /** Replaces the file, creating its folder when needed. */
  write(data: StoreData): void {
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, JSON.stringify(data, null, 2) + "\n");
  }

  /** Every message, or only those with the given status. */
  list(status?: MessageStatus): Message[] {
    const { messages } = this.read();
    return status ? messages.filter((m) => m.status === status) : messages;
  }

  /** Queues a message and returns it with its new id. */
  add(input: NewMessage): Message {
    const data = this.read();
    const message: Message = {
      id: `msg_${data.next_id++}`,
      to: input.to,
      body: input.body,
      status: "queued",
    };
    data.messages.push(message);
    this.write(data);
    return message;
  }

  /** Marks a message as sent, or returns undefined when there is no message with that id. */
  markSent(id: string): Message | undefined {
    const data = this.read();
    const message = data.messages.find((m) => m.id === id);
    if (!message) return undefined;
    message.status = "sent";
    message.sent_at = new Date().toISOString();
    this.write(data);
    return message;
  }
}
