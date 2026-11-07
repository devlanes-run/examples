import type { Mode } from "../mode.js";

/** A plain server for the `tcp` ready check, which only opens a connection. */
export const tcp: Mode = {
  behaviour:
    "Listens at once. The check never sends a request, so a broken route would still pass.",
};
