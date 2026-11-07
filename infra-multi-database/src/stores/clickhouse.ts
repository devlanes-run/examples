import { createClient } from "@clickhouse/client";
import { env } from "../env.js";
import { TIMEOUT_MS, namespaceOf, type Store } from "./store.js";

// The database comes from the URL's path, so every query runs in this lane's database.
const client = createClient({ url: env.clickhouseUrl, request_timeout: TIMEOUT_MS });

async function queryOne<T>(query: string): Promise<T> {
  const result = await client.query({ query, format: "JSONEachRow" });
  const [row] = await result.json<T>();
  return row;
}

/** A database per lane in the shared ClickHouse, created by infra.setup.clickhouse. */
export const clickhouse: Store = {
  key: "clickhouse",
  title: "ClickHouse",
  container: "shared",
  kind: "database",
  namespace: namespaceOf(env.clickhouseUrl),
  envVar: "CLICKHOUSE_URL",
  access: { console: `https://clickhouse.${env.domain}/play` },

  async health() {
    const row = await queryOne<{ version: string; db: string }>(
      "SELECT version() AS version, currentDatabase() AS db",
    );
    return `ClickHouse ${row.version}, connected to ${row.db}`;
  },

  async demo() {
    await client.command({
      query:
        "CREATE TABLE IF NOT EXISTS events (at DateTime64(3) DEFAULT now64(3), lane String, kind String) ENGINE = MergeTree ORDER BY at",
    });
    await client.insert({
      table: "events",
      values: [{ lane: env.laneName, kind: "click" }],
      format: "JSONEachRow",
    });
    const row = await queryOne<{ n: string; last: string }>(
      "SELECT count() AS n, toString(max(at)) AS last FROM events",
    );
    return [
      "INSERT INTO events -> 1 row",
      `SELECT count() FROM events -> ${row.n}, newest ${row.last}`,
    ];
  },
};
