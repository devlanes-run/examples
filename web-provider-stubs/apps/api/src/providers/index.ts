import { env } from "../env.js";
import { sendEmail } from "./email.js";
import type { SendResult } from "./http.js";
import { sendSms } from "./sms.js";

export { accepted, type SendResult } from "./http.js";

/** Fields from a form or a JSON body, before the provider client picks the ones it sends. */
export type Fields = Partial<Record<string, string>>;

/** A provider the api sends through, as its routes and pages see it. */
export type Provider = {
  label: string;
  /** The provider's base URL, which for a stub is also its inbox page. */
  url: string;
  send(fields: Fields): Promise<SendResult>;
};

/** Every provider, by the name its routes use (`/send/sms`, `/api/email`). */
export const providers = {
  sms: {
    label: "SMS",
    url: env.sms.url,
    send: (fields) => sendSms({ to: fields.to ?? "", body: fields.body ?? "" }),
  },
  email: {
    label: "Email",
    url: env.email.url,
    send: (fields) =>
      sendEmail({ to: fields.to ?? "", subject: fields.subject ?? "", text: fields.text ?? "" }),
  },
} satisfies Record<string, Provider>;

export type ProviderName = keyof typeof providers;
