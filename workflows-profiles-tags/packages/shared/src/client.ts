import type { ApiTarget } from "./env.js";
import type { ApiIndex } from "./records.js";

const TIMEOUT_MS = 2000;

/** One API's answer for a page: its index, or why the request failed. */
export type ApiResult = { ok: true; index: ApiIndex } | { ok: false; error: string };

/** Fetches an API's `/` server-side, turning a failure into a result the page can show. */
export async function loadIndex(api: ApiTarget): Promise<ApiResult> {
  try {
    const response = await fetch(`${api.url}/`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}` };
    return { ok: true, index: (await response.json()) as ApiIndex };
  } catch (error) {
    return { ok: false, error: errorCode(error) };
  }
}

/** Asks an API to add a record with its default values. */
export async function createRecord(api: ApiTarget, records: string): Promise<void> {
  const response = await fetch(`${api.url}/api/${records}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`${api.name} answered ${response.status} to POST /api/${records}`);
  }
}

/** The short reason a fetch failed, such as `ECONNREFUSED` when the API is not running. */
export function errorCode(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const cause = error.cause as { code?: string } | undefined;
  return cause?.code ?? error.message;
}
