import nodemailer from "nodemailer";
import { env } from "../env.js";
import { TIMEOUT_MS, now, plural, type Store } from "./store.js";

const transport = nodemailer.createTransport({
  url: env.smtpUrl,
  connectionTimeout: TIMEOUT_MS,
  socketTimeout: TIMEOUT_MS,
});

type MailpitInfo = { Version: string; Messages: number };
type MailpitMessages = { total: number; messages: { Subject: string }[] };

/** Calls the Mailpit API of this lane's own container. */
async function mailpit<T>(path: string): Promise<T> {
  const res = await fetch(`${env.mailpitUrl}${path}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Mailpit answered ${res.status}`);
  return (await res.json()) as T;
}

/** Mailpit per lane: infra.per_lane gives each lane its own container and inbox. */
export const mail: Store = {
  key: "mail",
  title: "Mailpit",
  container: "per lane",
  kind: "Compose project",
  // devlanes names a lane's own Compose project <project>-lane<index>.
  namespace: `${env.project}-lane${env.lane}`,
  envVar: "SMTP_URL",
  access: { console: `https://mail.${env.domain}` },

  async health() {
    const info = await mailpit<MailpitInfo>("/api/v1/info");
    return `Mailpit ${info.Version}, ${plural(info.Messages, "message")} in this lane's inbox`;
  },

  async demo() {
    const sent = await transport.sendMail({
      from: "app@example.invalid",
      to: "dev@example.invalid",
      subject: `Hello from ${env.laneName}`,
      text: `Sent by the multi-database example at ${now()}.`,
    });
    const list = await mailpit<MailpitMessages>("/api/v1/messages?limit=1");
    return [
      `SMTP ${sent.response}`,
      `GET /api/v1/messages -> ${plural(list.total, "message")}, newest "${list.messages[0]?.Subject}"`,
    ];
  },
};
