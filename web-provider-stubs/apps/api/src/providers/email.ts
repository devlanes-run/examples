import { env } from "../env.js";
import { postMessage, type SendResult } from "./http.js";

/** An email as the email provider's API takes it. */
export type EmailMessage = { to: string; subject: string; text: string };

/** Sends an email through the provider at EMAIL_API_URL. */
export function sendEmail(message: EmailMessage): Promise<SendResult> {
  return postMessage(env.email, message);
}
