import { laneInfo } from "../lane.js";
import { createApp, listen } from "../server.js";

/** A healthy server whose `/crash` route kills the process a second after answering. */
export function run(): void {
  const app = createApp();
  app.get("/crash", (c) => {
    // Thrown from a timer so nothing catches it and the process exits like a real crash.
    setTimeout(() => {
      throw new Error("crash requested through /crash");
    }, 1000);
    return c.text("crash-route exits in 1 second\n");
  });
  app.get("/", (c) => c.json({ ...laneInfo(c), routes: ["/crash"] }));
  listen(app);
}
