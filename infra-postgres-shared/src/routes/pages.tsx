import { Hono } from "hono";
import { jsxRenderer } from "hono/jsx-renderer";
import { laneInfo } from "../lane.js";
import { addNote, listNotes, parseNoteBody } from "../notes.js";
import { HomePage } from "../views/HomePage.js";

/** The lane page and the form that adds a note to it. */
export const pages = new Hono();

// Pages render their own <Layout>; the renderer only adds the doctype.
pages.use(jsxRenderer(({ children }) => <>{children}</>, { docType: true }));

pages.get("/", async (c) => {
  // A database error is part of what the page shows, for example while reset-db runs.
  const notes = await listNotes().then(
    (rows) => ({ rows }),
    (err: Error) => ({ error: err.message }),
  );
  return c.render(<HomePage info={laneInfo(c)} notes={notes} />);
});

pages.post("/notes", async (c) => {
  const form = await c.req.parseBody();
  const body = parseNoteBody(form.body);
  if (body) await addNote(body);
  return c.redirect("/", 303);
});
