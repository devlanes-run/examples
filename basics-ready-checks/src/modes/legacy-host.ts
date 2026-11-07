import { env } from "../env.js";
import type { Mode } from "../mode.js";

/** A server that answers only its own address, so the proxy must rewrite the Host header. */
export const legacyHost: Mode = {
  behaviour: "Answers 400 to any Host but the address it listens on.",
  allowedHost: `${env.host}:${env.port}`,
};
