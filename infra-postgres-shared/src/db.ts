import pg from "pg";
import { databaseEnv } from "./env.js";

/** The connection pool for the lane's database in the shared Postgres container. */
export const pool = new pg.Pool({
  connectionString: databaseEnv().url,
  connectionTimeoutMillis: 5_000,
  query_timeout: 10_000,
});

// reset-db drops the database with --force, which ends idle connections; without a
// listener the pool's error event would crash the process.
pool.on("error", (err) => console.error(`pool: ${err.message}`));
