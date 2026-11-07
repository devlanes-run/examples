import { laneEnv } from "@mprocs-migration/shared";

/** Everything the stub reads from its environment, parsed once at startup. */
export const env = {
  // Clients outside this repository post to 127.0.0.1:4010, so devlanes.yaml sets PORT: 4010
  // too, and the default is the same port.
  port: Number(process.env.PORT ?? 4010),
  host: process.env.HOST ?? "127.0.0.1",
  ...laneEnv(process.env),
};
