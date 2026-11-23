import { env } from "./env";

/** One build in the API's mock release feed. */
export type Release = { version: string; channel: "stable" | "beta"; date: string };

/** `GET /` on the API: its lane values and the release feed. */
export type ApiAnswer = { lane: number; service: string; url: string | null; releases: Release[] };

const TIMEOUT_MS = 5000;

/** Fetches the API's answer from its https hostname in this lane. */
export async function fetchApi(): Promise<ApiAnswer> {
  const res = await fetch(`${env.apiUrl}/`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as ApiAnswer;
}
