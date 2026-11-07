import { Pool } from "pg";
import { env } from "../env.js";
import { TIMEOUT_MS, namespaceOf, now, type Store } from "./store.js";

const database = namespaceOf(env.databaseUrl);

const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 4,
  connectionTimeoutMillis: TIMEOUT_MS,
  query_timeout: TIMEOUT_MS,
});
// An idle client that loses its connection must not take the server down.
pool.on("error", (err) => console.error("postgres:", err.message));

/** A database per lane in the shared Postgres, created by infra.setup.postgres. */
export const postgres: Store = {
  key: "postgres",
  title: "Postgres",
  container: "shared",
  kind: "database",
  namespace: database,
  envVar: "DATABASE_URL",
  // infra.project_name is the devlanes project name, so -p reaches the shared containers.
  access: { shell: `docker compose -p ${env.project} exec postgres psql -U postgres ${database}` },

  async health() {
    const { rows } = await pool.query<{ db: string; version: string }>(
      "SELECT current_database() AS db, current_setting('server_version') AS version",
    );
    return `PostgreSQL ${rows[0].version}, connected to ${rows[0].db}`;
  },

  async demo() {
    await pool.query(
      "CREATE TABLE IF NOT EXISTS notes (id serial PRIMARY KEY, body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now())",
    );
    const inserted = await pool.query<{ id: number }>(
      "INSERT INTO notes (body) VALUES ($1) RETURNING id",
      [`note from ${env.laneName} at ${now()}`],
    );
    const { rows } = await pool.query<{ n: number }>("SELECT count(*)::int AS n FROM notes");
    return [
      `INSERT INTO notes -> id ${inserted.rows[0].id}`,
      `SELECT count(*) FROM notes -> ${rows[0].n}`,
    ];
  },
};
