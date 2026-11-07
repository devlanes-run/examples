// Goes through the running API instead of the database, so it runs with after: services.
const api = process.env.API_URL;
const database = new URL(process.env.DATABASE_URL).pathname.slice(1);

const notes = [
  `Seeded through ${api}/api/notes after api was ready.`,
  `Only lane ${process.env.DEVLANES_LANE} has this note, in ${database}.`,
];

for (const body of notes) {
  const res = await fetch(`${api}/api/notes`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(`POST /api/notes: ${res.status} ${await res.text()}`);
  console.log(`seeded note ${(await res.json()).id}`);
}
