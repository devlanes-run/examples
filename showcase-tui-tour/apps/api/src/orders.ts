import { pool } from "./db.js";

/** One row of the orders table that the migrate task creates. */
export type Order = {
  id: number;
  customer: string;
  item: string;
  total_cents: number;
};

/** The fields a client sends to create an order. */
export type NewOrder = Omit<Order, "id">;

/** The 20 newest orders in the lane's database. */
export async function listOrders(): Promise<Order[]> {
  const { rows } = await pool.query<Order>(
    "SELECT id, customer, item, total_cents FROM orders ORDER BY id DESC LIMIT 20",
  );
  return rows;
}

/** Inserts an order and returns it with its id. */
export async function addOrder({ customer, item, total_cents }: NewOrder): Promise<Order> {
  const { rows } = await pool.query<Order>(
    "INSERT INTO orders (customer, item, total_cents) VALUES ($1, $2, $3) RETURNING id, customer, item, total_cents",
    [customer, item, total_cents],
  );
  return rows[0];
}

/** Returns the body as a NewOrder, or null when a field is missing or has the wrong type. */
export function parseNewOrder(body: unknown): NewOrder | null {
  if (typeof body !== "object" || body === null) return null;
  const { customer, item, total_cents } = body as Record<string, unknown>;
  if (typeof customer !== "string" || typeof item !== "string") return null;
  if (typeof total_cents !== "number" || !Number.isInteger(total_cents)) return null;
  return { customer, item, total_cents };
}
