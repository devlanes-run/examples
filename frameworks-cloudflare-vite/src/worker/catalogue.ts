/** One product from the Worker's mock catalogue. */
export type Item = { id: number; sku: string; name: string; price_cents: number };

/** The mock catalogue `/api/items` returns. */
export const catalogue: Item[] = [
  { id: 1, sku: "ACME-001", name: "Anvil", price_cents: 4999 },
  { id: 2, sku: "ACME-002", name: "Rocket skates", price_cents: 12900 },
  { id: 3, sku: "ACME-003", name: "Giant magnet", price_cents: 2450 },
];
