import { pool } from "./db.js";

/** One row of the notes table. */
export type Note = {
  id: number;
  body: string;
  created_at: Date;
};

/** The longest note the API and the form accept. */
export const MAX_NOTE_LENGTH = 200;

/** Every note in the lane's database, newest first. */
export async function listNotes(): Promise<Note[]> {
  const { rows } = await pool.query<Note>(
    "SELECT id, body, created_at FROM notes ORDER BY id DESC",
  );
  return rows;
}

/** Inserts a note and returns the stored row. */
export async function addNote(body: string): Promise<Note> {
  const { rows } = await pool.query<Note>(
    "INSERT INTO notes (body) VALUES ($1) RETURNING id, body, created_at",
    [body],
  );
  return rows[0]!;
}

/** Trims a submitted note, or returns null when it is empty or too long. */
export function parseNoteBody(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const body = value.trim();
  return body && body.length <= MAX_NOTE_LENGTH ? body : null;
}
