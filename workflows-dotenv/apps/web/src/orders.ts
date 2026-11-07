import { env } from "./env.js";

/** The answer of the api's `/api/orders`, or why the call failed. */
export type OrdersCheck = { status: number; count: number | null } | { error: string };

/** Calls the api's `/api/orders` from the server with the token from `.env`. */
export async function fetchOrders(): Promise<OrdersCheck> {
  try {
    // HTTPS through the devlanes proxy to the URL derived from APP_DOMAIN; devlanes points
    // NODE_EXTRA_CA_CERTS at its CA.
    const res = await fetch(`${env.urls.api}/api/orders`, {
      headers: { authorization: `Bearer ${env.apiToken}` },
      signal: AbortSignal.timeout(5000),
    });
    const body = (await res.json().catch(() => null)) as { orders?: unknown[] } | null;
    return { status: res.status, count: body?.orders?.length ?? null };
  } catch (err) {
    const cause = err instanceof Error ? (err.cause as { code?: string } | undefined) : undefined;
    return { error: cause?.code ?? String(err) };
  }
}
