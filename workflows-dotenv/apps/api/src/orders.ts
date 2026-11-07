/** An order as `/api/orders` returns it. */
export type Order = {
  id: string;
  customer: string;
  total: number;
};

/** Mock orders, so the token check has something to protect. */
export const orders: Order[] = [
  { id: "ord_1001", customer: "ada@example.invalid", total: 42.5 },
  { id: "ord_1002", customer: "grace@example.invalid", total: 18 },
  { id: "ord_1003", customer: "linus@example.invalid", total: 7.25 },
];
