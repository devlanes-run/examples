import type { Mode } from "../mode.js";

/** A server slow enough to watch `devlanes start` wait for it. */
export const slowStart: Mode = {
  behaviour: "Sleeps 8 s before it listens.",
  startDelayMs: 8000,
};
