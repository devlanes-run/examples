import { env } from "../env.js";
import { postMessage, type SendResult } from "./http.js";

/** A text message as the SMS provider's API takes it. */
export type SmsMessage = { to: string; body: string };

/** Sends an SMS through the provider at SMS_API_URL. */
export function sendSms(message: SmsMessage): Promise<SendResult> {
  return postMessage(env.sms, message);
}
