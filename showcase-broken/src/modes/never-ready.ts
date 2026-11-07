import { createApp, listen } from "../server.js";

/** Listens on `PORT` but answers 503 everywhere, `/healthz` included, so it never becomes ready. */
export function run(): void {
  const app = createApp({ healthz: false });
  app.all("*", (c) => c.text("not ready: waiting for a database that never comes up\n", 503));
  listen(app);
}
