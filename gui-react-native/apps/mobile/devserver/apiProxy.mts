import http from "node:http";
import { env } from "./env.mts";

const TIMEOUT_MS = 5000;

/**
 * Forwards a request under `/api` to this lane's API over plain HTTP, so the app reaches the
 * API through the one port it already reaches Metro on.
 */
export function apiProxy(req: http.IncomingMessage, res: http.ServerResponse): void {
  // Connect strips the /api mount point, so req.url is the API's own path.
  const target = new URL(req.url ?? "/", env.apiUrl);
  // The hop from Metro to the API skips the devlanes proxy, so the proxy's headers stay behind.
  const headers = Object.fromEntries(
    Object.entries(req.headers).filter(([name]) => !name.startsWith("x-forwarded-")),
  );
  const upstream = http.request(
    target,
    { method: req.method, headers: { ...headers, host: target.host }, timeout: TIMEOUT_MS },
    (answer) => {
      res.writeHead(answer.statusCode ?? 502, answer.headers);
      answer.pipe(res);
    },
  );
  upstream.on("timeout", () => upstream.destroy(new Error(`no answer in ${TIMEOUT_MS} ms`)));
  upstream.on("error", (error) => {
    if (!res.headersSent) {
      res.writeHead(502, { "content-type": "text/plain" });
    }
    res.end(`api at ${env.apiUrl} unreachable: ${error.message}`);
  });
  req.pipe(upstream);
}
