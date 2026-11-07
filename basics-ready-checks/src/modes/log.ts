import type { Mode } from "../mode.js";

/** A server that warms up before it prints the line the `log` ready check matches. */
export const log: Mode = {
  behaviour: "Waits 3 s, then listens and prints its listening line.",
  startDelayMs: 3000,
};
