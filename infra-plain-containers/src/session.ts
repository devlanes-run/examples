import { randomBytes } from "node:crypto";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { IDToken } from "openid-client";
import type { PendingLogin } from "./oidc.js";

/** A browser's session: a login in progress, or the claims of the ID token it ended with. */
export type Session = {
  login?: PendingLogin;
  claims?: IDToken;
};

const COOKIE = "sid";
// In memory, so a restart of web logs every browser out.
const sessions = new Map<string, Session>();

/** The session of the request's cookie, if the server still knows it. */
export function getSession(c: Context): Session | undefined {
  const sid = getCookie(c, COOKIE);
  return sid ? sessions.get(sid) : undefined;
}

/** Starts a new session and sets its cookie on the response. */
export function createSession(c: Context, session: Session): void {
  const sid = randomBytes(16).toString("hex");
  sessions.set(sid, session);
  setCookie(c, COOKIE, sid, { path: "/", httpOnly: true, secure: true, sameSite: "Lax" });
}

/** Forgets the request's session and clears its cookie. */
export function endSession(c: Context): void {
  const sid = getCookie(c, COOKIE);
  if (sid) sessions.delete(sid);
  deleteCookie(c, COOKIE, { path: "/", secure: true });
}
