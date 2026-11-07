import { commonRoutes, env, hostUrl, laneInfo, tenants } from "@example-wildcard-tenants/shared";
import { Hono } from "hono";
import { jsxRenderer } from "hono/jsx-renderer";
import { session } from "./session.js";
import { HomePage } from "./views/HomePage.js";

export const app = new Hono();

app.route("/", commonRoutes);

// Pages render their own <Layout>; the renderer only adds the doctype.
app.use(jsxRenderer(({ children }) => <>{children}</>, { docType: true }));
app.get("/", (c) => {
  const links = Object.entries(tenants).map(([name, tenant]) => ({
    name,
    shop: tenant.shop,
    url: hostUrl(c, `${name}.${env.sitesDomain}`),
  }));
  return c.render(
    <HomePage
      info={laneInfo(c)}
      session={session(c)}
      tenants={links}
      goUrl={hostUrl(c, `go.${env.domain}`, "")}
      unclaimedUrl={hostUrl(c, `billing.${env.domain}`)}
    />,
  );
});
