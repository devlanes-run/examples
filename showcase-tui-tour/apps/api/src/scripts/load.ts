// Run with `devlanes exec --name load -- npm run load -w apps/api`: an ad-hoc unit that asks the
// API for its orders once a second until you stop it. The npm script passes --use-system-ca
// because devlanes 0.11.3 gives exec units no NODE_EXTRA_CA_CERTS; `devlanes setup` put the
// devlanes CA in the system store.
import { loadEnv } from "../env.js";

type OrdersResponse = { lane: number; orders: unknown[] };

const INTERVAL_MS = 1_000;

/** Requests the orders once and prints the status, the count and the lane that answered. */
async function probe(url: string): Promise<void> {
  const clock = new Date().toTimeString().slice(0, 8);
  const started = performance.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(INTERVAL_MS) });
    const body = (await res.json()) as OrdersResponse;
    const ms = Math.round(performance.now() - started);
    console.log(
      `${clock} ${res.status} ${body.orders.length} orders from lane ${body.lane} in ${ms}ms`,
    );
  } catch (err) {
    // Keep going, so a stopped or frozen API shows up here and the next answer does too.
    console.log(`${clock} ${describe(err)}`);
  }
}

/** The most specific message of a failed fetch: undici puts the socket error in `cause`. */
function describe(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  return err.cause instanceof Error ? err.cause.message : err.message;
}

const url = `${loadEnv().apiUrl}/api/orders`;
console.log(`GET ${url} once a second`);
setInterval(() => void probe(url), INTERVAL_MS);
