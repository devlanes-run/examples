import type { Provider } from "./provider.js";

/** A message the fake provider accepted, with one string per field its provider requires. */
export type Message = { id: string; received_at: string } & Record<string, string>;

/** What `Inbox.receive` did with a message: stored it, or refused it for missing fields. */
export type ReceiveResult = { ok: true; message: Message } | { ok: false; missing: string[] };

const LIMIT = 100;

/** The messages one fake provider received, newest first. */
export class Inbox {
  // Kept in memory only, so stopping the stub empties its inbox.
  readonly #messages: Message[] = [];
  #nextId = 1;

  constructor(readonly provider: Provider) {}

  /** Stores a message when every field of the provider is a non-empty string. */
  receive(input: Record<string, unknown>): ReceiveResult {
    const fields: Record<string, string> = {};
    const missing: string[] = [];
    for (const field of this.provider.fields) {
      const value = input[field];
      if (typeof value === "string" && value !== "") fields[field] = value;
      else missing.push(field);
    }
    if (missing.length > 0) return { ok: false, missing };

    const message: Message = {
      id: `${this.provider.kind}_${this.#nextId++}`,
      received_at: new Date().toISOString(),
      ...fields,
    };
    this.#messages.unshift(message);
    this.#messages.length = Math.min(this.#messages.length, LIMIT);
    return { ok: true, message };
  }

  /** The stored messages, newest first. */
  list(): readonly Message[] {
    return this.#messages;
  }
}
