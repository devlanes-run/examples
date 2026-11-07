import { Hono } from "hono";
import { MAX_NOTE_LENGTH, addNote, listNotes, parseNoteBody } from "../notes.js";

/** The JSON API, mounted under /api. The seed task posts its notes here. */
export const api = new Hono();

api.get("/notes", async (c) => c.json(await listNotes()));

api.post("/notes", async (c) => {
  const payload: { body?: unknown } = await c.req.json().catch(() => ({}));
  const body = parseNoteBody(payload.body);
  if (!body) {
    return c.json({ error: `body must be 1 to ${MAX_NOTE_LENGTH} characters` }, 400);
  }
  return c.json(await addNote(body), 201);
});

api.onError((err, c) => c.json({ error: err.message }, 500));
