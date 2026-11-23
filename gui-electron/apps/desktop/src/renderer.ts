import { net } from "electron";

const RETRY_MS = 500;
const ATTEMPT_TIMEOUT_MS = 5000;
const TOTAL_TIMEOUT_MS = 120_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Resolves once the renderer's dev server answers with a 2xx. devlanes starts `web` and
 * `desktop` together, and until `web` is ready the proxy answers with its own 503 page.
 */
export async function waitForRenderer(url: string): Promise<void> {
  const deadline = Date.now() + TOTAL_TIMEOUT_MS;
  let last = "no answer";
  while (Date.now() < deadline) {
    try {
      // net.fetch goes through Chromium's network stack, so it trusts what the window trusts.
      const res = await net.fetch(url, { signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS) });
      if (res.ok) return;
      last = `${res.status} ${res.statusText}`;
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await sleep(RETRY_MS);
  }
  throw new Error(`${url} did not answer within ${TOTAL_TIMEOUT_MS / 1000}s: ${last}`);
}
