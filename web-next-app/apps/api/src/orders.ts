export type Order = {
  id: string;
  customer: string;
  total: number;
  status: "paid" | "pending" | "shipped";
};

/** Mock orders the API returns, so the page has records to count. */
export const orders: Order[] = [
  { id: "ord_1001", customer: "acme", total: 129.9, status: "paid" },
  { id: "ord_1002", customer: "globex", total: 42.0, status: "pending" },
  { id: "ord_1003", customer: "initech", total: 310.5, status: "shipped" },
];
