import {
  commonRoutes,
  env,
  hostname,
  hostUrl,
  laneInfo,
  subdomain,
  tenants,
} from "@example-wildcard-tenants/shared";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { jsxRenderer } from "hono/jsx-renderer";
import { TenantPage } from "./views/TenantPage.js";

export const app = new Hono();

app.route("/", commonRoutes);

// Pages render their own <Layout>; the renderer only adds the doctype.
app.use(jsxRenderer(({ children }) => <>{children}</>, { docType: true }));
// The wildcard route sends every tenant here; the Host header says which one was asked for.
app.get("*", (c) => {
  const host = hostname(c);
  const name = subdomain(host, env.sitesDomain) ?? host;
  const tenant = tenants[name];
  if (!tenant) c.status(404);
  return c.render(
    <TenantPage
      info={laneInfo(c)}
      host={host}
      name={name}
      tenant={tenant}
      path={c.req.path}
      cookieHeader={c.req.header("cookie") ?? null}
      session={getCookie(c, "session") ?? null}
      appUrl={hostUrl(c, `app.${env.domain}`)}
    />,
  );
});
