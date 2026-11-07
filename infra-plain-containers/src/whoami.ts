import { serverEnv } from "./env.js";

const TIMEOUT_MS = 5000;

/** The part of the whoami container's `/api` answer the page shows. */
export type WhoamiInfo = {
  hostname: string;
};

/** Asks the shared whoami container which container answered. */
export async function whoami(): Promise<WhoamiInfo> {
  const res = await fetch(`${serverEnv().whoamiUrl}/api`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`whoami answered ${res.status}`);
  const body = (await res.json()) as { hostname: string };
  return { hostname: body.hostname };
}
