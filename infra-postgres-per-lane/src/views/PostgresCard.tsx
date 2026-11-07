import type { PostgresState } from "../db.js";

/** The lane's own Postgres container with its latest rows and the form that adds one. */
export function PostgresCard({ postgres }: { postgres: PostgresState }) {
  const notes = postgres.latest
    .map((note) => `#${note.id}  ${note.created_at.toISOString()}  ${note.body}`)
    .join("\n");
  return (
    <>
      <div class="dl-card">
        <div class="dl-bar">
          <span class="dl-dots">
            <i />
            <i />
            <i />
          </span>
          <span>per_lane: [postgres]</span>
          <span />
        </div>
        <dl class="dl-rows">
          <dt>container</dt>
          <dd class="dl-ok">{postgres.container}</dd>
          <dt>port</dt>
          <dd>{postgres.port}</dd>
          <dt>database</dt>
          <dd>
            {postgres.database} <span class="dl-key">Postgres {postgres.version}</span>
          </dd>
          <dt>rows</dt>
          <dd>{postgres.rows} in notes</dd>
        </dl>
        <pre>{notes || "no rows yet"}</pre>
      </div>
      <form method="post" action="/notes">
        <button class="dl-button">Add a row</button>
      </form>
    </>
  );
}
