/** Where a short code points: a path on one tenant's site. */
export type ShortCode = {
  tenant: string;
  path: string;
};

/** The mock short codes, keyed by the path they answer on `go.`. */
export const codes: Record<string, ShortCode> = {
  hello: { tenant: "alice", path: "/" },
  sale: { tenant: "bob", path: "/sale" },
};
