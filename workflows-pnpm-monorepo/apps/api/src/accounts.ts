/** A customer account, as the web and admin pages list it. */
export type Account = { id: number; name: string; plan: string; seats: number };

/** Mock records; every lane serves the same ones. */
export const accounts: Account[] = [
  { id: 1, name: "Acme Rockets", plan: "enterprise", seats: 120 },
  { id: 2, name: "Acme Anvils", plan: "team", seats: 14 },
  { id: 3, name: "Acme Magnets", plan: "starter", seats: 3 },
];
