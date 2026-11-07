import pg from "pg";
import { env } from "./env.js";

const pool = new pg.Pool({
  connectionString: env.postgres.url,
  connectionTimeoutMillis: 5_000,
  query_timeout: 5_000,
});

/** A row of the notes table that infra/schema.sql creates in the lane's Postgres. */
export type Note = {
  id: number;
  body: string;
  created_at: Date;
};

/** What the page and /api/state show about the lane's own Postgres. */
export type PostgresState = {
  container: string;
  port: number;
  database: string;
  version: string;
  rows: number;
  latest: Note[];
};

/** Reads the server version, the row count and the latest notes. */
export async function postgresState(): Promise<PostgresState> {
  const [server, count, latest] = await Promise.all([
    pool.query<{ version: string }>("SELECT current_setting('server_version') AS version"),
    pool.query<{ n: number }>("SELECT count(*)::int AS n FROM notes"),
    pool.query<Note>("SELECT id, body, created_at FROM notes ORDER BY id DESC LIMIT 10"),
  ]);
  return {
    container: env.postgres.container,
    port: env.postgres.port,
    database: env.postgres.database,
    version: server.rows[0]?.version ?? "unknown",
    rows: count.rows[0]?.n ?? 0,
    latest: latest.rows,
  };
}

/** Inserts a note that names the lane it came from. */
export async function addNote(): Promise<void> {
  await pool.query("INSERT INTO notes (body) VALUES ($1)", [`added in lane ${env.lane}`]);
}
