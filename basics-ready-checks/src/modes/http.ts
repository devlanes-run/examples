import type { Mode } from "../mode.js";

/** A plain server for the `http` ready check. */
export const http: Mode = {
  behaviour: "Listens at once and answers GET /healthz with 200 ok.",
};
