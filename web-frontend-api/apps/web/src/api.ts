import { env } from "./env";

/** One product from the API's mock catalogue. */
export type Item = { id: number; sku: string; name: string; price_cents: number };

/** `GET /api/items`. */
export type ItemsResponse = { lane: number; items: Item[] };

/** `GET /api/me`, signed in or not. */
export type Me =
  | { signed_in: true; lane: number; user: string; since: string }
  | { signed_in: false; lane: number };

const TIMEOUT_MS = 5000;

// ?api=<url> points the page at another lane's API, to watch CORS refuse it.
export const apiUrl = new URLSearchParams(window.location.search).get("api") ?? env.apiUrl;

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  // credentials: "include" sends and stores the session cookie on cross-origin calls.
  const res = await fetch(url, {
    credentials: "include",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

/** Fetches the items cross-origin from the API's own hostname. */
export const fetchItems = () => getJson<ItemsResponse>(`${apiUrl}/api/items`);

/** Fetches the API's `/lane` through Vite's `/proxied` route on the page's own host. */
export const fetchProxiedLane = () => getJson<Record<string, unknown>>("/proxied/lane");

/** Asks the API who the session cookie belongs to. */
export const fetchMe = () => getJson<Me>(`${apiUrl}/api/me`);

/** Signs in (`POST`) or out (`DELETE`); the API sets or clears the cookie. */
export const changeSession = (method: "POST" | "DELETE") =>
  getJson<{ signed_in: boolean }>(`${apiUrl}/api/session`, { method });
