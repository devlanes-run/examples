// Applies the SQL files in src/migrations that the lane's database has not seen yet, in name
// order. The migrate task runs it on every lane start, so a run with nothing new does nothing.
import { readdir, readFile } from "node:fs/promises";
import type { PoolClient } from "pg";
import { pool } from "../db.js";
import { databaseEnv } from "../env.js";

const MIGRATIONS = new URL("../migrations/", import.meta.url);

/** Names of the migrations already recorded in schema_migrations. */
async function appliedMigrations(client: PoolClient): Promise<Set<string>> {
  await client.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  const { rows } = await client.query<{ name: string }>("SELECT name FROM schema_migrations");
  return new Set(rows.map((row) => row.name));
}

/** Runs one migration file and records it, in a single transaction. */
async function apply(client: PoolClient, name: string): Promise<void> {
  const sql = await readFile(new URL(name, MIGRATIONS), "utf8");
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
}

async function main(): Promise<void> {
  const files = (await readdir(MIGRATIONS)).filter((file) => file.endsWith(".sql")).sort();
  const client = await pool.connect();
  try {
    const applied = await appliedMigrations(client);
    const pending = files.filter((file) => !applied.has(file));
    for (const name of pending) {
      await apply(client, name);
      console.log(`applied ${name}`);
    }
    console.log(`${databaseEnv().name}: ${pending.length} applied, ${applied.size} already there`);
  } finally {
    client.release();
    await pool.end();
  }
}

await main();
