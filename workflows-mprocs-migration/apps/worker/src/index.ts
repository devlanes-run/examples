// Sends queued messages through the SMS provider. It has no port, so devlanes waits for the
// "worker ready" line, which it prints once the api has answered.
import { ApiClient, describeError } from "@mprocs-migration/shared";
import { setTimeout as sleep } from "node:timers/promises";
import { env } from "./env.js";
import { sendSms } from "./sms.js";

const POLL_MS = 2_000;

const api = new ApiClient(env.apiUrl);
let lastProblem = "";

// Polling repeats the same failure every two seconds; the log shows it once.
function report(problem: string): void {
  if (problem !== lastProblem) console.log(problem);
  lastProblem = problem;
}

function reportApiDown(err: unknown): void {
  report(`api not reachable at ${env.apiUrl}: ${describeError(err)}`);
}

/** Waits until the api answers. mprocs had `deps: [api]` for this; devlanes has the ready line. */
async function connect(): Promise<void> {
  for (;;) {
    try {
      await api.listMessages("queued");
      console.log(`worker ready: polling ${env.apiUrl}, sending SMS through ${env.smsUrl}`);
      return;
    } catch (err) {
      reportApiDown(err);
      await sleep(POLL_MS);
    }
  }
}

/** Sends every queued message, stopping at the first one the provider does not take. */
async function deliverQueued(): Promise<void> {
  let queued;
  try {
    queued = await api.listMessages("queued");
  } catch (err) {
    return reportApiDown(err);
  }
  for (const message of queued) {
    try {
      await sendSms(message);
    } catch (err) {
      const reason = describeError(err);
      return report(`sms-stub not reachable at ${env.smsUrl}: ${reason}; ${queued.length} queued`);
    }
    try {
      await api.markSent(message.id);
    } catch (err) {
      return reportApiDown(err);
    }
    console.log(`sent ${message.id} to ${message.to} through ${env.smsUrl}`);
  }
  lastProblem = "";
}

function handleShutdown(): void {
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      console.log(`worker stopping on ${signal}`);
      process.exit(0);
    });
  }
}

async function main(): Promise<void> {
  handleShutdown();
  await connect();
  for (;;) {
    await deliverQueued();
    await sleep(POLL_MS);
  }
}

await main();
