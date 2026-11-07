// Posts the first notes through the running API instead of writing to the database, which is
// why the seed task has after: services.
import { databaseEnv, seedEnv } from "../env.js";

type CreatedNote = { id: number };

/** Posts one note to the API and returns its id. */
async function postNote(apiUrl: string, body: string): Promise<number> {
  const res = await fetch(`${apiUrl}/api/notes`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ body }),
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) throw new Error(`POST /api/notes: ${res.status} ${await res.text()}`);
  const note = (await res.json()) as CreatedNote;
  return note.id;
}

async function main(): Promise<void> {
  const { apiUrl, lane } = seedEnv();
  const notes = [
    `Seeded through ${apiUrl}/api/notes after api was ready.`,
    `Only lane ${lane} has this note, in ${databaseEnv().name}.`,
  ];
  for (const body of notes) {
    console.log(`seeded note ${await postNote(apiUrl, body)}`);
  }
}

await main();
