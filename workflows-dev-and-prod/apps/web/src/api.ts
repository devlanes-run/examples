import type { LaneInfo, WebMode } from "../plugins/laneRoutes";

export type { LaneInfo, WebMode };

/** One release from the API's mock list. */
export type Release = { version: string; channel: string; date: string };

/** The api's run mode, from `apps/api/src/mode.ts`. */
export type ApiMode = {
  script: string | null;
  runs_from: "src" | "dist";
  node_env: string | null;
  profile: string | null;
  project_file: string;
  log_level: string;
};

/** `GET /` on the api: its lane values, its run mode and the releases. */
export type ApiRoot = LaneInfo & { mode: ApiMode; releases: Release[] };

const TIMEOUT_MS = 5000;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

/** The lane values from the Vite server that served this page. */
export const fetchLane = () => getJson<LaneInfo>("/lane");

/** How the Vite server that served this page was started. */
export const fetchWebMode = () => getJson<WebMode>("/mode");

/** The api's `/`, fetched cross-origin from its own hostname. */
export const fetchApiRoot = (apiUrl: string) => getJson<ApiRoot>(`${apiUrl}/`);
