import { createApp, listen } from "../server.js";

/** Ignores `PORT` and lets the OS pick, like a server with its own port setting. */
export function run(): void {
  const app = createApp();
  app.get("/", (c) => c.text("wrong-port answered\n"));
  listen(app, 0);
}
