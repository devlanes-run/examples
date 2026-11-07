import { setTimeout as sleep } from "node:timers/promises";
import type { Range } from "./env.js";

// A boot works in slices this long with a pause after each, about 40% of a core,
// so the CPU graph shows the start without one service taking a whole core.
const SLICE_MS = 40;
const PAUSE_MS = 60;

/** A random whole number of milliseconds within the range. */
export function pick({ min, max }: Range): number {
  return Math.round(min + Math.random() * (max - min));
}

/** Keeps the thread busy for `ms`; the result is returned only so the loop is not optimised away. */
function busy(ms: number): number {
  const end = performance.now() + ms;
  let sum = 0;
  while (performance.now() < end) sum += Math.sqrt(Math.random());
  return sum;
}

/** Works for `ms` before returning, standing in for a dev server that compiles before it listens. */
export async function boot(ms: number): Promise<void> {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    busy(SLICE_MS);
    await sleep(PAUSE_MS);
  }
}

/** Burns CPU for a `length` burst after each `every` pause, forever, and reports each burst. */
export function startBursts(length: Range, every: Range, onBurst: (ms: number) => void): void {
  const next = () => {
    const ms = pick(length);
    busy(ms);
    onBurst(ms);
    setTimeout(next, pick(every));
  };
  setTimeout(next, pick(every));
}
