import { env } from "./env";

/** One task from the API's mock checklist. */
export type Task = { id: number; title: string; done: boolean };

/** `GET /` on the API: its own lane values plus the tasks. */
export type ApiAnswer = {
  lane: number;
  service: string;
  port: number;
  url: string | null;
  tasks: Task[];
};

const TIMEOUT_MS = 5000;

/** Fetches the API's answer from this lane's API, giving up after five seconds. */
export async function fetchAnswer(): Promise<ApiAnswer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${env.apiUrl}/`, { signal: controller.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return (await res.json()) as ApiAnswer;
  } finally {
    clearTimeout(timer);
  }
}
