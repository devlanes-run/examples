import { ApiClient } from "@mprocs-migration/shared";
import type { NewMessage } from "@mprocs-migration/store";
import { env } from "../env.js";

const MESSAGES: NewMessage[] = [
  { to: "+15550100", body: "Your acme code is 482193" },
  { to: "+15550101", body: "Order ACME-001 (1 anvil) has shipped" },
  { to: "+15550102", body: "Your rocket skates arrive tomorrow" },
];

// Seeds through the running api rather than the file, so the api has to be up first.
const api = new ApiClient(env.apiUrl);

for (const message of MESSAGES) {
  const created = await api.createMessage(message);
  console.log(`queued ${created.id} to ${created.to}`);
}
