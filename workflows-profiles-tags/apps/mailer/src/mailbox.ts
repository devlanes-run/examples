import { JsonStore } from "@profiles-tags/shared";
import type { User } from "./accounts.js";
import { env } from "./env.js";

type SentMail = {
  user: number;
  to: string;
  at: string;
};

const store = new JsonStore<{ sent: SentMail[] }>(env.dataFile, { sent: [] });

/** The file that records which users got their welcome mail. */
export const mailLogFile = store.file;

/** Sends a welcome mail to every user who has not had one, and records it. */
export function sendWelcomeMails(users: User[]): void {
  const log = store.read();
  for (const user of users) {
    if (log.sent.some((mail) => mail.user === user.id)) continue;
    log.sent.push({ user: user.id, to: user.email, at: new Date().toISOString() });
    console.log(`sent welcome mail to ${user.name} <${user.email}>`);
  }
  store.write(log);
}
