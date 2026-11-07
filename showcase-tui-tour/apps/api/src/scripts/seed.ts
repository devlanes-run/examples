// Posts the first orders through the running API instead of writing to the database, which is
// why the seed task has after: services.
import { seedEnv } from "../env.js";
import type { NewOrder, Order } from "../orders.js";

/** Posts one order to the API and returns its id. */
async function postOrder(apiUrl: string, order: NewOrder): Promise<number> {
  const res = await fetch(`${apiUrl}/api/orders`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(order),
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) throw new Error(`POST /api/orders: ${res.status} ${await res.text()}`);
  return ((await res.json()) as Order).id;
}

async function main(): Promise<void> {
  const { apiUrl, lane } = seedEnv();
  const orders: NewOrder[] = [
    { customer: "wile@acme.example.invalid", item: "Anvil", total_cents: 4999 },
    { customer: "road@acme.example.invalid", item: "Rocket skates", total_cents: 12900 },
    {
      customer: `lane${lane}@acme.example.invalid`,
      item: `Giant magnet for lane ${lane}`,
      total_cents: 2450,
    },
  ];
  for (const order of orders) {
    console.log(`seeded order ${await postOrder(apiUrl, order)}: ${order.item}`);
  }
}

await main();
