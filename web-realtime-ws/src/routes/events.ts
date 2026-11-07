import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { ticker } from "../realtime/ticker.js";

/** `GET /events`: a Server-Sent Event per tick, for as long as the client stays connected. */
export const eventsRoutes = new Hono().get("/", (c) =>
  streamSSE(c, async (stream) => {
    await stream.writeSSE({ data: JSON.stringify(ticker.current()) });
    const unsubscribe = ticker.subscribe((tick) => {
      void stream.writeSSE({ data: JSON.stringify(tick) });
    });
    // The callback's promise is the stream's lifetime, so hold it open until the client leaves.
    await new Promise<void>((resolve) => stream.onAbort(resolve));
    unsubscribe();
  }),
);
