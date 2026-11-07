import type { IncomingHttpHeaders } from "node:http";
import { request } from "node:https";
import { publicUrl } from "../env.js";
import { createApp, listen } from "../server.js";

const TIMEOUT_MS = 10_000;

/** Sends a request to `target` with `headers` unchanged and resolves with the answer. */
function forward(target: URL, method: string, headers: IncomingHttpHeaders): Promise<Response> {
  return new Promise((resolve) => {
    // node:https instead of fetch, which does not let a caller set the Host header.
    const upstream = request(target, { method, headers, timeout: TIMEOUT_MS }, (answer) => {
      const chunks: Buffer[] = [];
      answer.on("data", (chunk: Buffer) => chunks.push(chunk));
      answer.on("end", () => {
        const contentType = answer.headers["content-type"] ?? "text/plain";
        resolve(
          new Response(Buffer.concat(chunks), {
            status: answer.statusCode ?? 502,
            headers: { "content-type": contentType },
          }),
        );
      });
    });
    upstream.on("timeout", () => upstream.destroy(new Error(`no answer in ${TIMEOUT_MS} ms`)));
    upstream.on("error", (error) =>
      resolve(new Response(`proxy-loop: ${error.message}\n`, { status: 502 })),
    );
    upstream.end();
  });
}

/**
 * Forwards every request to its own public URL and keeps the Host header, the mistake a dev
 * server proxy without `changeOrigin` makes, so the request comes back through the devlanes proxy.
 */
export function run(): void {
  const base = publicUrl();
  const app = createApp();
  app.all("*", (c) => {
    const { pathname, search } = new URL(c.req.url);
    return forward(new URL(pathname + search, base), c.req.method, c.env.incoming.headers);
  });
  listen(app);
}
