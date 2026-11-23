import { env } from "./env";

/** One note from the API's mock notebook. */
export type Note = { id: number; title: string; updated: string };

/** `GET /` on the API: its lane values and the notes. */
export type ApiAnswer = {
  lane: number;
  service: string;
  url: string | null;
  notes: Note[];
};

const TIMEOUT_MS = 5000;

/** Fetches the API's answer from its https hostname. */
export async function fetchApi(): Promise<ApiAnswer> {
  const res = await fetch(`${env.apiUrl}/`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as ApiAnswer;
}
