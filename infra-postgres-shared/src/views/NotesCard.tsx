import type { Note } from "../notes.js";
import { MAX_NOTE_LENGTH } from "../notes.js";

/** The notes query's outcome: the rows, or the database error the page shows instead. */
export type NotesResult = { rows: Note[] } | { error: string };

type NotesCardProps = {
  database: string;
  notes: NotesResult;
};

/** The form that adds a note and the card with every note in the lane's database. */
export function NotesCard({ database, notes }: NotesCardProps) {
  return (
    <>
      <form class="pg-add" method="post" action="/notes">
        <input
          name="body"
          required
          maxlength={MAX_NOTE_LENGTH}
          placeholder={`A note for ${database}`}
        />
        <button class="dl-button" type="submit">
          Add note
        </button>
      </form>
      <div class="dl-card">
        <div class="dl-bar">
          <span class="dl-dots">
            <i />
            <i />
            <i />
          </span>
          <span>SELECT * FROM notes</span>
          <span />
        </div>
        {"error" in notes ? (
          <pre class="dl-bad">{notes.error}</pre>
        ) : (
          <NoteRows rows={notes.rows} />
        )}
      </div>
    </>
  );
}

function NoteRows({ rows }: { rows: Note[] }) {
  return (
    <dl class="dl-rows">
      {rows.length === 0 ? (
        <>
          <dt>-</dt>
          <dd>No notes yet.</dd>
        </>
      ) : (
        rows.map((note) => (
          <>
            <dt>#{note.id}</dt>
            <dd>{note.body}</dd>
          </>
        ))
      )}
    </dl>
  );
}
