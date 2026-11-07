import { randomBytes } from "node:crypto";
import { env } from "@example-wildcard-tenants/shared";
import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";

/** The attributes `session` sets besides Domain and Path, as the page shows them. */
export const SESSION_FLAGS = "Max-Age=86400; Secure; HttpOnly; SameSite=Lax";

/** The visitor's session id, set as a new cookie when the request carried none. */
export function session(c: Context): string {
  const existing = getCookie(c, "session");
  if (existing) return existing;

  const id = randomBytes(6).toString("hex");
  // Domain= sends the cookie to every name under the lane domain (go., the gateway's subdomains)
  // and to none under the tenant sites' domain, which is another site.
  setCookie(c, "session", id, {
    domain: env.domain,
    path: "/",
    maxAge: 86400,
    secure: true,
    httpOnly: true,
    sameSite: "Lax",
  });
  return id;
}
