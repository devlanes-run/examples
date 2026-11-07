import type { Handler } from "hono";
import { createRecord, errorCode } from "./client.js";
import type { ApiTarget } from "./env.js";

/** Handles a page's "Add" form: creates the record through the API, then reloads the page. */
export function addRecord(api: ApiTarget, records: string): Handler {
  return async (c) => {
    try {
      await createRecord(api, records);
    } catch (error) {
      return c.text(`${api.name} did not add to ${records}: ${errorCode(error)}\n`, 502);
    }
    return c.redirect("/", 303);
  };
}
