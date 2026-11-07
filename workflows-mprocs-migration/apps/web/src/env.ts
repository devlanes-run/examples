import { laneEnv } from "@mprocs-migration/shared";

/**
 * Everything the page reads from its environment, parsed once at startup. The defaults are lane 0
 * of the mprocs setup in `before/`.
 */
export const env = {
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? "127.0.0.1",
  ...laneEnv(process.env),
  // Server-side calls go to the api's loopback address; the page links to the hostnames.
  apiUrl: process.env.API_URL ?? "http://127.0.0.1:4000",
  apiPublicUrl: process.env.API_PUBLIC_URL ?? "https://api.acme.localhost",
  smsPublicUrl: process.env.SMS_PUBLIC_URL ?? "https://sms.acme.localhost",
};
