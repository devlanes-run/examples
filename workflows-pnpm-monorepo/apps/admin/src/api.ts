import { env } from "./env";

/** One customer account from the API's mock records. */
export type Account = { id: number; name: string; plan: string; seats: number };

/** `GET /api/accounts`. */
export type AccountsResponse = { lane: number; accounts: Account[] };

const TIMEOUT_MS = 5000;

/** The URL `fetchAccounts` calls, on the API's own hostname. */
export const accountsUrl = `${env.apiUrl}/api/accounts`;

/** Fetches the accounts cross-origin from this lane's API. */
export async function fetchAccounts(): Promise<AccountsResponse> {
  const res = await fetch(accountsUrl, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as AccountsResponse;
}
