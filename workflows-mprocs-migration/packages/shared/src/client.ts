import type { Message, MessageStatus, NewMessage } from "@mprocs-migration/store";

const TIMEOUT_MS = 5_000;

/** The api's message routes, for the web page, the worker and the seed script. */
export class ApiClient {
  constructor(readonly baseUrl: string) {}

  /** Every message, or only those with the given status. */
  async listMessages(status?: MessageStatus): Promise<Message[]> {
    const query = status ? `?status=${status}` : "";
    const { messages } = await this.#request<{ messages: Message[] }>(
      "GET",
      `/api/messages${query}`,
    );
    return messages;
  }

  /** Queues a message for the worker. */
  createMessage(input: NewMessage): Promise<Message> {
    return this.#request("POST", "/api/messages", input);
  }

  /** Records that the SMS provider accepted a message. */
  markSent(id: string): Promise<Message> {
    return this.#request("POST", `/api/messages/${encodeURIComponent(id)}/sent`);
  }

  async #request<T>(method: string, path: string, body?: object): Promise<T> {
    const res = await fetch(new URL(path, this.baseUrl), {
      method,
      headers: body ? { "content-type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(`${method} ${path} answered ${res.status}: ${await res.text()}`);
    }
    return (await res.json()) as T;
  }
}

/** The short reason a call failed: the network error code when there is one. */
export function describeError(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  // fetch wraps network failures, so ECONNREFUSED and friends are on the cause.
  const cause = err.cause;
  if (typeof cause === "object" && cause !== null && "code" in cause) return String(cause.code);
  return err.message;
}
