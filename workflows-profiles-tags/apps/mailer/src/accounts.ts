import { env } from "./env.js";

const TIMEOUT_MS = 2000;

/** A user as accounts-api returns it. */
export type User = {
  id: number;
  name: string;
  email: string;
};

/** Where the mailer reads users from. */
export const usersUrl = `${env.accountsApiUrl}/api/users`;

/** Fetches every user from accounts-api. */
export async function fetchUsers(): Promise<User[]> {
  const response = await fetch(usersUrl, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`accounts-api answered ${response.status}`);
  return (await response.json()) as User[];
}
