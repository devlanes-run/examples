import type { JSX } from "hono/jsx/jsx-runtime";
import type { LaneInfo } from "./lane.js";

/** How one mode changes the shared server. */
export type Mode = {
  /** One line on how the app behaves in this mode, shown on its page. */
  behaviour: string;
  /** Wait this long before listening, standing in for a slow startup. */
  startDelayMs?: number;
  /** The only Host header the app answers; any Host when unset or null. */
  allowedHost?: string | null;
  /** Replaces the service page at `/`. */
  page?: (info: LaneInfo) => JSX.Element;
};
