// Seeds through the running api, so the api has to be up first.
const apiUrl = process.env.API_URL ?? "http://127.0.0.1:4000";

const messages = [
  { to: "+15550100", body: "Your acme code is 482193" },
  { to: "+15550101", body: "Order ACME-001 (1 anvil) has shipped" },
  { to: "+15550102", body: "Your rocket skates arrive tomorrow" },
];

for (const message of messages) {
  const res = await fetch(`${apiUrl}/api/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(message),
  });
  if (!res.ok) {
    console.error(`POST ${apiUrl}/api/messages answered ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  const created = await res.json();
  console.log(`queued ${created.id} to ${created.to}`);
}
