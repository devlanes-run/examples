import { laneInfo } from "@example-dotenv/config";
import { Hono } from "hono";
import { env } from "./env.js";
import { apiRoutes } from "./routes/api.js";

export const app = new Hono();

app.get("/healthz", (c) => c.text("ok"));
app.get("/lane", (c) => c.json(laneInfo(c, env)));
app.get("/", (c) =>
  c.json({
    ...laneInfo(c, env),
    config: {
      app_domain: env.urls.domain,
      web_url: env.urls.web,
      api_url: env.urls.api,
      asset_url: env.urls.assets,
      cookie_domain: env.urls.cookieDomain,
      feature_flags: env.featureFlags,
      sentry: env.sentry,
    },
  }),
);
app.route("/api", apiRoutes);

app.notFound((c) => c.json({ error: "not_found" }, 404));
