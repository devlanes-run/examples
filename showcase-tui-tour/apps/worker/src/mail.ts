import type { Transporter } from "nodemailer";
import { env } from "./env.js";

/** A mail the API queued, with the fields of MailJob in apps/api/src/mail.ts. */
export type MailJob = {
  id: string;
  to: string;
  subject: string;
  queued_at: string;
};

/** A sent job, as the API reads it back from mail:done. */
export type SentMail = MailJob & { sent_at: string; took_ms: number; smtp: string };

/** Sends one job over SMTP to the lane's Mailpit and returns the record of it. */
export async function deliver(mail: Transporter, job: MailJob): Promise<SentMail> {
  const started = performance.now();
  const info = await mail.sendMail({
    from: `worker@${env.domain}`,
    to: job.to,
    subject: job.subject,
    text: `Queued by api at ${job.queued_at}, sent by the worker of lane ${env.lane} (${env.branch}).`,
  });
  return {
    ...job,
    sent_at: new Date().toISOString(),
    took_ms: Math.round(performance.now() - started),
    smtp: info.response ?? "",
  };
}
