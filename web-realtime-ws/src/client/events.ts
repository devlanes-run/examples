import type { Tick } from "../messages.js";
import { byId, setState } from "./dom.js";

// A tick older than this means the stream stalled, usually because the lane is frozen.
const STALE_AFTER_S = 3;

/** Follows `/events` and shows the last tick and how long ago it arrived. */
export function watchTicks(): void {
  const state = byId("sse-state");
  const last = byId("sse-tick");
  const age = byId("sse-age");
  let receivedAt = 0;

  const events = new EventSource("/events");
  events.onopen = () => setState(state, "open", true);
  events.onerror = () => setState(state, "reconnecting", false);
  events.onmessage = (event: MessageEvent<string>) => {
    const { lane, tick, time } = JSON.parse(event.data) as Tick;
    receivedAt = Date.now();
    last.textContent = `#${tick} from lane ${lane} at ${time.slice(11, 19)}`;
  };

  setInterval(() => {
    if (!receivedAt) return;
    const seconds = Math.round((Date.now() - receivedAt) / 1000);
    const fresh = seconds < STALE_AFTER_S;
    setState(age, fresh ? "just now" : `${seconds}s ago, no tick since`, fresh);
  }, 500);
}
