// Sends queued messages through the SMS provider. No port: devlanes waits for
// the "worker ready" line, printed once the api has answered.
import { setTimeout as sleep } from "node:timers/promises";

const env = process.env;
const apiUrl = env.API_URL ?? "http://127.0.0.1:4000";
const smsUrl = env.SMS_URL ?? "http://127.0.0.1:4010";
const lane = env.DEVLANES_LANE === undefined ? null : Number(env.DEVLANES_LANE);

let ready = false;
let lastProblem = "";

// Print a problem once, not on every poll.
function report(problem) {
  if (problem !== lastProblem) console.log(problem);
  lastProblem = problem;
}

const reason = (err) => err.cause?.code ?? err.message;

async function tick() {
  let queued;
  try {
    const res = await fetch(`${apiUrl}/api/messages?status=queued`);
    if (!res.ok) throw new Error(`api answered ${res.status}`);
    ({ messages: queued } = await res.json());
  } catch (err) {
    return report(`api not reachable at ${apiUrl}: ${reason(err)}`);
  }
  if (!ready) {
    ready = true;
    console.log(`worker ready: polling ${apiUrl}, sending SMS through ${smsUrl}`);
  }
  for (const message of queued) {
    try {
      const res = await fetch(`${smsUrl}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to: message.to, body: message.body, from_lane: lane }),
      });
      if (!res.ok) throw new Error(`answered ${res.status}`);
    } catch (err) {
      return report(`sms-stub not reachable at ${smsUrl}: ${reason(err)}; ${queued.length} queued`);
    }
    await fetch(`${apiUrl}/api/messages/${message.id}/sent`, { method: "POST" });
    console.log(`sent ${message.id} to ${message.to} through ${smsUrl}`);
  }
  lastProblem = "";
}

for (;;) {
  await tick();
  await sleep(2000);
}
