import type { Target } from "./env.js";
import type { Stats } from "./stats.js";

// The index reloads every 2 seconds, so a service that is still booting must not hold it up.
const TIMEOUT_MS = 1000;

/** One line of the index page: a service's stats, or why it did not answer. */
export type Row = {
  name: string;
  link: string;
  stats: Stats | null;
  error: string | null;
};

/** The error code a refused or timed-out fetch carries, such as ECONNREFUSED or TimeoutError. */
function reason(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const code = (error.cause as { code?: unknown } | undefined)?.code;
  return typeof code === "string" ? code : error.name;
}

async function probe({ name, url, link }: Target): Promise<Row> {
  try {
    const answer = await fetch(`${url}/stats`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!answer.ok) return { name, link, stats: null, error: `HTTP ${answer.status}` };
    return { name, link, stats: (await answer.json()) as Stats, error: null };
  } catch (error) {
    return { name, link, stats: null, error: reason(error) };
  }
}

/** Asks every service for `/stats` at once. */
export function probeAll(targets: Target[]): Promise<Row[]> {
  return Promise.all(targets.map(probe));
}
