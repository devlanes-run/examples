const LIVE_URL = "/jobs/live";
const INTERVAL_MS = 1_000;
// Long enough for a slow answer, short enough that a stopped api shows within a few seconds.
const TIMEOUT_MS = 3_000;

function byId(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error(`#${id} is missing from the page`);
  return element;
}

function setState(element: HTMLElement, text: string, ok: boolean): void {
  element.textContent = text;
  element.className = ok ? "dl-ok" : "dl-bad";
}

/** Redraws `#jobs` every second with the HTML the server renders at `/jobs/live`. */
export function followJobs(): void {
  const jobs = byId("jobs");
  const state = byId("live-state");
  let pending = false;

  const refresh = async () => {
    // A slow answer must not stack requests behind it.
    if (pending) return;
    pending = true;
    try {
      const res = await fetch(LIVE_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!res.ok) throw new Error(`the api answered ${res.status}`);
      jobs.innerHTML = await res.text();
      setState(state, "live", true);
    } catch (err) {
      setState(state, err instanceof Error ? err.message : String(err), false);
    } finally {
      pending = false;
    }
  };

  void refresh();
  setInterval(refresh, INTERVAL_MS);
}
