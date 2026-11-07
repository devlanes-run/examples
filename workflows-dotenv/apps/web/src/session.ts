import { randomBytes } from "node:crypto";
import { getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { env } from "./env.js";

/** The cookie the page sets and the browser sends to the api. */
export const SESSION_COOKIE = "acme_session";

/** Gives a browser without one an `acme_session` cookie on the lane's cookie domain. */
export const session = createMiddleware(async (c, next) => {
  if (!getCookie(c, SESSION_COOKIE)) {
    setCookie(c, SESSION_COOKIE, randomBytes(4).toString("hex"), {
      domain: env.urls.cookieDomain,
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "Lax",
    });
  }
  await next();
});
