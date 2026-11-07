import { Hono } from "hono";
import { callbackUrl, finishLogin, startLogin } from "../oidc.js";
import { createSession, endSession, getSession } from "../session.js";

/** The OIDC code flow against the lane's provider: login, callback and logout. */
export const auth = new Hono();

auth.get("/login", async (c) => {
  const { login, url } = await startLogin();
  createSession(c, { login });
  return c.redirect(url.href, 303);
});

auth.get("/callback", async (c) => {
  const session = getSession(c);
  if (!session?.login) return c.text("no login in progress\n", 400);
  session.claims = await finishLogin(callbackUrl(c.req.url), session.login);
  delete session.login;
  console.log(`logged in as ${session.claims.sub}, iss ${session.claims.iss}`);
  return c.redirect("/", 303);
});

auth.get("/logout", (c) => {
  endSession(c);
  return c.redirect("/", 303);
});
