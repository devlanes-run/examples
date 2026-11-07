/** A text message the fake provider accepted. */
export type Sms = {
  id: string;
  to: string;
  body: string;
  /** The sender's lane, so a message from another lane stands out. */
  from_lane: number | null;
  received_at: string;
};

/** The messages the stub received, oldest first. */
export class Inbox {
  // Kept in memory only, so stopping the stub empties its inbox.
  readonly #messages: Sms[] = [];

  /** Stores a message and returns it with its id. */
  receive(input: Pick<Sms, "to" | "body" | "from_lane">): Sms {
    const sms: Sms = {
      id: `sms_${this.#messages.length + 1}`,
      ...input,
      received_at: new Date().toISOString(),
    };
    this.#messages.push(sms);
    return sms;
  }

  /** Every message received since the stub started. */
  list(): readonly Sms[] {
    return this.#messages;
  }
}
