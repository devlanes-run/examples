import {
  commonRoutes,
  env,
  hostname,
  hostUrl,
  laneInfo,
  subdomain,
} from "@example-wildcard-tenants/shared";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { jsxRenderer } from "hono/jsx-renderer";
import { GatewayPage } from "./views/GatewayPage.js";

export const app = new Hono();

app.route("/", commonRoutes);

// Pages render their own <Layout>; the renderer only adds the doctype.
app.use(jsxRenderer(({ children }) => <>{children}</>, { docType: true }));
// The fallback route sends here every lane subdomain no other service claims.
app.get("*", (c) => {
  const host = hostname(c);
  return c.render(
    <GatewayPage
      info={laneInfo(c)}
      host={host}
      subdomain={subdomain(host, env.domain) ?? host}
      path={c.req.path}
      session={getCookie(c, "session") ?? null}
      appUrl={hostUrl(c, `app.${env.domain}`)}
    />,
  );
});
