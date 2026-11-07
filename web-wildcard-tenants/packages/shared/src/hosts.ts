import type { Context } from "hono";

/** The hostname the browser asked for, lowercased and without a port. */
export function hostname(c: Context): string {
  return (c.req.header("host") ?? "").replace(/:\d+$/, "").toLowerCase();
}

/** The label in front of `.${domain}` in `host`, such as `alice` or `a.b`, or null when `host` is not under `domain`. */
export function subdomain(host: string, domain: string): string | null {
  const suffix = `.${domain}`;
  return host.endsWith(suffix) ? host.slice(0, -suffix.length) : null;
}

/** An https URL on another hostname of the lane. */
export function hostUrl(c: Context, host: string, path = "/"): string {
  // The proxy may run on 8443 instead of 443; keep the port the browser used.
  const port = /:\d+$/.exec(c.req.header("host") ?? "")?.[0] ?? "";
  return `https://${host}${port}${path}`;
}
