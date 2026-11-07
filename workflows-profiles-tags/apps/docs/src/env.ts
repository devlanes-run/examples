import { readServerEnv } from "@profiles-tags/shared";

/** Everything docs reads from its environment, parsed once at startup. */
export const env = readServerEnv();
