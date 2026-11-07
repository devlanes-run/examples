import { serverEnv } from "@acme/config";

/** Everything this service reads from its environment, parsed once at startup. */
export const env = serverEnv(process.env);
