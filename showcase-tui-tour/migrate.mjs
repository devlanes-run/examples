import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
console.log(`applying migrations to ${client.database}`);
await client.query(`
  CREATE TABLE IF NOT EXISTS orders (
    id serial PRIMARY KEY,
    customer text NOT NULL,
    item text NOT NULL,
    total_cents integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )
`);
console.log(`${client.database} is up to date`);
await client.end();
