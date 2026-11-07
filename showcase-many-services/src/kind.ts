import type { Hono } from "hono";

/** What one kind of service adds to the shared server. */
export type Kind = {
  /** Registers the kind's own routes, `/` among them. */
  routes: (app: Hono) => void;
  /** Prints a line per CPU burst, for kinds whose logs show their work. */
  onBurst?: (count: number, ms: number) => void;
};
