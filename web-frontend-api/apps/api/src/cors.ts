import { cors } from "hono/cors";
import { env } from "./env.js";

/** CORS for this lane's own origins, with credentials so the session cookie travels. */
export function laneCors() {
  return cors({
    origin: env.origins,
    allowMethods: ["GET", "POST", "DELETE"],
    allowHeaders: ["content-type"],
    credentials: true,
  });
}
