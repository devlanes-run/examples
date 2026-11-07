/** A product the catalog lists. */
export type Item = {
  id: number;
  sku: string;
  name: string;
  price_cents: number;
};

/** The mock products every lane's catalog returns. */
export const items: Item[] = [
  { id: 1, sku: "ACME-101", name: "Tornado seeds", price_cents: 1250 },
  { id: 2, sku: "ACME-102", name: "Earthquake pills", price_cents: 3400 },
  { id: 3, sku: "ACME-103", name: "Dehydrated boulders", price_cents: 899 },
];
