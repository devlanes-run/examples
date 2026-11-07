export type Tenant = {
  shop: string;
  items: string[];
};

/** The mock tenants, keyed by the subdomain their site answers on. */
export const tenants: Record<string, Tenant> = {
  alice: { shop: "Alice's Plants", items: ["Monstera", "Fern", "Cactus"] },
  bob: { shop: "Bob's Bikes", items: ["Road bike", "Helmet", "Pump"] },
};
