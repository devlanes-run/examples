import { clickhouse } from "./clickhouse.js";
import { mail } from "./mail.js";
import { postgres } from "./postgres.js";
import { rabbitmq } from "./rabbitmq.js";
import { redis } from "./redis.js";
import { s3 } from "./s3.js";
import { TIMEOUT_MS, type Store } from "./store.js";

export type { Store } from "./store.js";

/** Every store in the order the dashboard shows them. */
export const stores: Store[] = [postgres, redis, clickhouse, rabbitmq, s3, mail];

/** The outcome of a health check or a demo, kept as a value so one failing store never hides the others. */
export type Outcome<T> = { ok: true; value: T } | { ok: false; error: string };

// The clients have their own timeouts; this bound also covers a client stuck reconnecting.
async function settle<T>(work: () => Promise<T>): Promise<Outcome<T>> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`no answer in ${TIMEOUT_MS} ms`)), TIMEOUT_MS);
  });
  try {
    return { ok: true, value: await Promise.race([work(), timeout]) };
  } catch (err) {
    return { ok: false, error: describe(err) };
  } finally {
    clearTimeout(timer);
  }
}

// A refused connection to 127.0.0.1 and ::1 arrives as an AggregateError with an empty message.
function describe(err: unknown): string {
  if (err instanceof AggregateError && err.errors.length) return describe(err.errors[0]);
  return (err instanceof Error && err.message) || String(err);
}

/** Runs every store's health check at once, keyed by store. */
export async function checkAll(): Promise<Record<string, Outcome<string>>> {
  const results = await Promise.all(stores.map((store) => settle(() => store.health())));
  return Object.fromEntries(stores.map((store, i) => [store.key, results[i]]));
}

/** Runs one store's write-then-read. */
export function runDemo(store: Store): Promise<Outcome<string[]>> {
  return settle(() => store.demo());
}
