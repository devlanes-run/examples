/** An invoice of one of the accounts the main app lists. */
export type Invoice = {
  id: string;
  account: string;
  total_cents: number;
  status: "paid" | "open" | "overdue";
};

/** Mock records; every lane serves the same ones. */
export const invoices: Invoice[] = [
  { id: "INV-1001", account: "Acme Rockets", total_cents: 1188000, status: "paid" },
  { id: "INV-1002", account: "Acme Anvils", total_cents: 138600, status: "open" },
  { id: "INV-1003", account: "Acme Magnets", total_cents: 8700, status: "overdue" },
];

/** Formats cents as dollars, such as `$87.00`. */
export const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;
