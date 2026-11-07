import type { LaneInfo } from "./lane";

/** What the api service answers on `/`: its lane values and the mock orders. */
export type ApiAnswer = LaneInfo & { items: unknown[] };

/** The outcome of one request to the api service, with its timing. */
export type FetchResult = {
  target: string;
  ms: number;
  status?: number;
  answer?: ApiAnswer;
  error?: string;
};

const TIMEOUT_MS = 5_000;

/** Requests `/` from the api service at `base` and reports the answer or the error. */
export async function fetchApi(base: string): Promise<FetchResult> {
  const started = performance.now();
  const elapsed = () => performance.now() - started;
  try {
    const res = await fetch(`${base}/`, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      const error = `HTTP ${res.status} ${res.statusText}`;
      return { target: base, ms: elapsed(), status: res.status, error };
    }
    const answer = (await res.json()) as ApiAnswer;
    return { target: base, ms: elapsed(), status: res.status, answer };
  } catch (err) {
    return { target: base, ms: elapsed(), error: describe(err) };
  }
}

function describe(err: unknown): string {
  // fetch reports "fetch failed" and puts the TLS or connection error in cause.
  const cause = err instanceof Error && err.cause instanceof Error ? err.cause : err;
  return String(cause);
}
