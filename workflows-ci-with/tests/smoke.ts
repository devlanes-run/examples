// A quick check for `devlanes exec --name smoke -- ...` against a running lane.
// Exits 1 when a service does not answer /healthz.
import { lane } from "./env.js";

/** Prints one service's `/healthz` answer and returns whether it was a 2xx. */
async function check(service: string, url: string): Promise<boolean> {
  try {
    const res = await fetch(`${url}/healthz`, { signal: AbortSignal.timeout(5_000) });
    console.log(`${service} ${url}/healthz ${res.status} ${await res.text()}`);
    return res.ok;
  } catch (err) {
    const error = err as Error & { cause?: Error };
    console.log(`${service} ${url}/healthz failed: ${error.cause?.message ?? error.message}`);
    return false;
  }
}

let failed = false;
for (const [service, url] of Object.entries(lane.urls)) {
  if (!(await check(service, url))) failed = true;
}
process.exitCode = failed ? 1 : 0;
