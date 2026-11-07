import { optional, serverEnv } from "@acme/config";

/** Everything this service reads from its environment, parsed once at startup. */
export const env = {
  ...serverEnv(process.env),
  // web of example-pnpm-monorepo, another devlanes project; unset while none of its lanes runs.
  monorepoWebUrl: optional(process.env, "MONOREPO_WEB_URL"),
};
