import { randomBytes } from "node:crypto";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { CookieOptions } from "hono/utils/cookie";
import { env } from "../env.js";

type Session = { user: string; since: string };

// In memory on purpose: each lane's API process has its own sessions.
const sessions = new Map<string, Session>();

// Domain= makes the cookie reach every name under the lane domain: the page on
// example-frontend-api.localhost and this API on api.example-frontend-api.localhost.
// HttpOnly is left out only so the page can show document.cookie.
const cookie: CookieOptions = {
  domain: env.cookieDomain,
  path: "/",
  sameSite: "Lax",
  secure: true,
};

/** `POST` and `DELETE /api/session` sign in and out; `GET /api/me` reads the cookie back. */
export const sessionRoutes = new Hono()
  .post("/session", (c) => {
    const token = randomBytes(12).toString("hex");
    sessions.set(token, { user: "wile@acme.example.invalid", since: new Date().toISOString() });
    setCookie(c, "session", token, cookie);
    return c.json({ signed_in: true }, 201);
  })
  .delete("/session", (c) => {
    const token = getCookie(c, "session");
    if (token) sessions.delete(token);
    deleteCookie(c, "session", cookie);
    return c.json({ signed_in: false });
  })
  .get("/me", (c) => {
    const token = getCookie(c, "session");
    const session = token ? sessions.get(token) : undefined;
    if (!session) {
      return c.json({ signed_in: false, lane: env.lane, cookie_sent: Boolean(token) });
    }
    return c.json({ signed_in: true, lane: env.lane, ...session });
  });
