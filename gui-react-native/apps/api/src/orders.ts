/** One delivery the app lists. */
export type Order = {
  id: number;
  item: string;
  status: "packed" | "shipped" | "delivered";
};

/** The mock orders every lane's API serves. */
export const orders: Order[] = [
  { id: 1041, item: "Anvil", status: "delivered" },
  { id: 1042, item: "Rocket skates", status: "shipped" },
  { id: 1043, item: "Giant magnet", status: "packed" },
];
