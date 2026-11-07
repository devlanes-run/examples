import { SCHEMA, type StoreData } from "@mprocs-migration/store";
import { store } from "../store.js";

/** Brings a data file at an older schema up to `SCHEMA`, returning the steps it took. */
function upgrade(data: StoreData): string[] {
  const steps: string[] = [];
  if (data.schema === 1) {
    // Schema 1 had no delivery status; everything in it was still queued.
    for (const message of data.messages) message.status ??= "queued";
    data.schema = 2;
    steps.push("1 -> 2");
  }
  return steps;
}

function main(): void {
  if (!store.exists()) {
    store.write({ schema: SCHEMA, next_id: 1, messages: [] });
    console.log(`created ${store.path} at schema ${SCHEMA}`);
    return;
  }
  const data = store.read();
  const steps = upgrade(data);
  if (steps.length === 0) {
    console.log(`${store.path} is at schema ${data.schema}, nothing to do`);
    return;
  }
  store.write(data);
  console.log(`migrated ${store.path}: schema ${steps.join(", ")}`);
}

main();
