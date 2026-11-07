import pg from "pg";
import { databaseEnv } from "./env.js";

/** Connections to this lane's database in the shared Postgres. */
export const pool = new pg.Pool({
  connectionString: databaseEnv().url,
  max: 4,
  connectionTimeoutMillis: 5_000,
});

// Without a handler, an idle connection that Postgres ends would crash the process.
pool.on("error", (err) => console.error(`pg pool: ${err.message}`));

/** Asks Postgres which database the pool reached, so a wrong DATABASE_URL fails at startup. */
export async function currentDatabase(): Promise<string> {
  const { rows } = await pool.query<{ db: string }>("SELECT current_database() AS db");
  return rows[0].db;
}
