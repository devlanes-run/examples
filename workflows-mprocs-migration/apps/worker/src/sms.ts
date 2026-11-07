import type { Message } from "@mprocs-migration/store";
import { env } from "./env.js";

const TIMEOUT_MS = 5_000;

/** Hands one message to the SMS provider at `SMS_URL`, throwing when it does not accept it. */
export async function sendSms(message: Message): Promise<void> {
  const res = await fetch(new URL("/messages", env.smsUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ to: message.to, body: message.body, from_lane: env.lane }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`answered ${res.status}`);
}
