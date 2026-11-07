/** The lane values every example shows; `url` is null when the request skipped the proxy. */
export type LaneInfo = {
  project: string;
  lane: number;
  lane_name: string;
  branch: string;
  service: string;
  port: number;
  url: string | null;
};

/** `GET /api/lane`: the lane values plus what the Vite plugin got from devlanes. */
export type WorkerLane = LaneInfo & { inspector_port: number; state_path: string };

/** One product from the Worker's mock catalogue. */
export type Item = { id: number; sku: string; name: string; price_cents: number };

/** `GET /api/items`. */
export type ItemsResponse = LaneInfo & { items: Item[] };

/** `GET` and `POST /api/counter`. */
export type CounterResponse = { count: number };

const TIMEOUT_MS = 5000;

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { signal: AbortSignal.timeout(TIMEOUT_MS), ...init });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

/** Asks the Worker for the lane it runs in. */
export const fetchLane = () => getJson<WorkerLane>("/api/lane");

/** Fetches the Worker's mock catalogue. */
export const fetchItems = () => getJson<ItemsResponse>("/api/items");

/** Reads the lane's count from the Worker's KV namespace. */
export const fetchCount = () => getJson<CounterResponse>("/api/counter");

/** Adds one to the lane's count. */
export const incrementCount = () => getJson<CounterResponse>("/api/counter", { method: "POST" });
