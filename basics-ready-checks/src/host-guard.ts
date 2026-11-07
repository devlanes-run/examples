import type { MiddlewareHandler } from "hono";

/** True when `host` names the allowed host, the way Django's ALLOWED_HOSTS compares them. */
function matches(host: string, allowed: string): boolean {
  if (host === allowed) return true;
  // A hostname without a port also matches when the proxy fell back to port 8443.
  return !allowed.includes(":") && host.replace(/:\d+$/, "") === allowed;
}

/** Answers 400 to every request whose Host header is not `allowed`, health checks included. */
export function onlyHost(allowed: string): MiddlewareHandler {
  return async (c, next) => {
    const host = c.req.header("host") ?? "";
    if (matches(host, allowed)) return next();
    console.log(`rejected Host ${host} for ${c.req.path}`);
    return c.text(`invalid host ${host}: this app answers only on ${allowed}\n`, 400);
  };
}
