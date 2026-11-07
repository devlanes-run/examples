import { env } from "../env.js";
import type { Mode } from "../mode.js";

/** A server that answers only its public hostname, so its ready check must send that Host. */
export const ownHost: Mode = {
  behaviour: "Answers 400 to any Host but its own hostname, ready checks included.",
  allowedHost: env.allowedHost,
};
