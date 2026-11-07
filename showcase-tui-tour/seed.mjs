// Goes through the running API instead of the database, so it runs with after: services.
const api = process.env.API_URL;
const lane = process.env.DEVLANES_LANE;

const orders = [
  { customer: "wile@acme.example.invalid", item: "Anvil", total_cents: 4999 },
  { customer: "road@acme.example.invalid", item: "Rocket skates", total_cents: 12900 },
  { customer: `lane${lane}@acme.example.invalid`, item: `Giant magnet for lane ${lane}`, total_cents: 2450 },
];

for (const order of orders) {
  const res = await fetch(`${api}/api/orders`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(order),
  });
  if (!res.ok) throw new Error(`POST /api/orders: ${res.status} ${await res.text()}`);
  console.log(`seeded order ${(await res.json()).id}: ${order.item}`);
}
