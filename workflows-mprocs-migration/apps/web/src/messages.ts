import { ApiClient, describeError } from "@mprocs-migration/shared";
import type { Message } from "@mprocs-migration/store";
import { env } from "./env.js";

/** The api's messages, or why the page could not get them. */
export type MessagesResult = { ok: true; messages: Message[] } | { ok: false; error: string };

const api = new ApiClient(env.apiUrl);

/** Fetches the messages for the page, turning a failure into something the page can show. */
export async function loadMessages(): Promise<MessagesResult> {
  try {
    return { ok: true, messages: await api.listMessages() };
  } catch (err) {
    return { ok: false, error: `${env.apiUrl}: ${describeError(err)}` };
  }
}
