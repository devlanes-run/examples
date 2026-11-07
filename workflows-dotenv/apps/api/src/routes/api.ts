import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { getCookie } from "hono/cookie";
import { cors } from "hono/cors";
import { env } from "../env.js";
import { orders } from "../orders.js";

/** `/api/orders` behind the token and `/api/session` for the browser. */
export const apiRoutes = new Hono();

const wrongToken = { error: "missing or wrong ACME_API_TOKEN" };

// web calls this from its server with the ACME_API_TOKEN both services got from .env.
apiRoutes.get(
  "/orders",
  bearerAuth({
    token: env.apiToken,
    noAuthenticationHeader: { message: wrongToken },
    invalidAuthenticationHeader: { message: wrongToken },
    invalidToken: { message: wrongToken },
  }),
  (c) => c.json({ orders }),
);

// The browser calls this from the web origin with its cookie, so only this lane's origins may
// read the answer.
apiRoutes.use("/session", cors({ origin: env.origins, credentials: true }));
apiRoutes.get("/session", (c) => c.json({ session: getCookie(c, "acme_session") ?? null }));
