import { errorCode } from "@profiles-tags/shared";
import { fetchUsers, usersUrl } from "./accounts.js";
import { env } from "./env.js";
import { mailLogFile, sendWelcomeMails } from "./mailbox.js";

const POLL_MS = 3000;

let reachable = true;

/** One pass: read the users and mail the new ones, logging only when accounts-api goes or comes back. */
async function poll(): Promise<void> {
  try {
    const users = await fetchUsers();
    if (!reachable) console.log(`accounts-api answers again at ${usersUrl}`);
    reachable = true;
    sendWelcomeMails(users);
  } catch (error) {
    if (reachable) console.log(`accounts-api unreachable at ${usersUrl}: ${errorCode(error)}`);
    reachable = false;
  }
}

/** Polls accounts-api until the process stops. */
function startLoop(): NodeJS.Timeout {
  void poll();
  return setInterval(() => void poll(), POLL_MS);
}

/** Stops polling on the signal devlanes sends when it stops the service. */
function handleShutdown(timer: NodeJS.Timeout): void {
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      clearInterval(timer);
      console.log(`${env.service} stopped on ${signal}`);
      process.exit(0);
    });
  }
}

// devlanes waits for this line (ready.log in devlanes.yaml), since the mailer has no port to probe.
console.log(`worker ready: ${env.service} reads ${usersUrl}, mail log in ${mailLogFile}`);
handleShutdown(startLoop());
