import { Hono } from "hono";
import { addNote } from "../db.js";

/** The "Add a row" form: inserts into the lane's Postgres and goes back to the page. */
export const notes = new Hono();

notes.post("/", async (c) => {
  await addNote();
  return c.redirect("/", 303);
});
