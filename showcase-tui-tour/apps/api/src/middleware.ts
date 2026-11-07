import type { MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { serverEnv } from "./env.js";

/** CORS and CSRF for this lane's own origins: the page on the lane's web hostname may call the API. */
export function laneOrigins(): MiddlewareHandler[] {
  const { origins } = serverEnv();
  return [
    cors({ origin: origins, allowMethods: ["GET", "POST"], allowHeaders: ["content-type"] }),
    csrf({ origin: origins }),
  ];
}

/** Logs one line per request, like `21:04:11 GET /api/orders 200 1ms`. */
export function requestLog(): MiddlewareHandler {
  return async (c, next) => {
    const started = performance.now();
    await next();
    // The ready check polls /healthz all the time; leave it out of the log.
    if (c.req.header("user-agent") === "devlanes-ready") return;
    const ms = Math.round(performance.now() - started);
    const clock = new Date().toTimeString().slice(0, 8);
    console.log(`${clock} ${c.req.method} ${c.req.path} ${c.res.status} ${ms}ms`);
  };
}
