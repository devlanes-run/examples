import { env } from "./env";

/** One order from the lane's database. */
export type Order = { id: number; customer: string; item: string; total_cents: number };

/** `GET /api/orders`. */
export type OrdersResponse = { lane: number; database: string; orders: Order[] };

/** A mail the worker sent, from `GET /api/mail`. */
export type SentMail = { id: string; to: string; took_ms: number };

/** `GET /api/mail`: the lane's Redis index, its queue and the last mails sent. */
export type MailState = {
  redis_db: number;
  owner: string | null;
  queued: number;
  done: SentMail[];
};

const TIMEOUT_MS = 5000;

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${env.apiUrl}${path}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

/** The orders, read by the API from the lane's database. */
export const fetchOrders = () => getJson<OrdersResponse>("/api/orders");

/** The lane's mail queue in Redis. */
export const fetchMail = () => getJson<MailState>("/api/mail");

/** Queues a mail to `to`; the worker sends it a moment later. */
export const sendMail = (to: string) =>
  getJson<{ id: string }>("/api/mail", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ to }),
  });
