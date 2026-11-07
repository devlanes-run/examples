import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query(`
  CREATE TABLE IF NOT EXISTS notes (
    id serial PRIMARY KEY,
    body text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )
`);
console.log(`notes table ready in ${client.database}`);
await client.end();
