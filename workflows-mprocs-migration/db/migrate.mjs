import { SCHEMA, dataFile, exists, load, save } from "./store.mjs";

if (!exists()) {
  save({ schema: SCHEMA, next_id: 1, messages: [] });
  console.log(`created ${dataFile} at schema ${SCHEMA}`);
} else {
  const data = load();
  if (data.schema === 1) {
    // Schema 1 had no delivery status; everything in it was still queued.
    for (const message of data.messages) message.status ??= "queued";
    data.schema = 2;
    save(data);
    console.log(`migrated ${dataFile} from schema 1 to 2`);
  } else {
    console.log(`${dataFile} is at schema ${data.schema}, nothing to do`);
  }
}
