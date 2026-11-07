// The migrate task runs this on every lane start, so it only creates what is missing.
import { pool } from "../db.js";
import { databaseEnv } from "../env.js";

const CREATE_ORDERS = `
  CREATE TABLE IF NOT EXISTS orders (
    id serial PRIMARY KEY,
    customer text NOT NULL,
    item text NOT NULL,
    total_cents integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )
`;

async function main(): Promise<void> {
  const { name } = databaseEnv();
  console.log(`applying migrations to ${name}`);
  try {
    await pool.query(CREATE_ORDERS);
    console.log(`${name} is up to date`);
  } finally {
    await pool.end();
  }
}

await main();
