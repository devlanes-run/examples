import { commonRoutes, env, hostUrl, laneInfo } from "@example-wildcard-tenants/shared";
import { Hono, type Context } from "hono";
import { jsxRenderer } from "hono/jsx-renderer";
import { codes, type ShortCode } from "./codes.js";
import { LinksPage } from "./views/LinksPage.js";

export const app = new Hono();

/** The tenant URL a short code redirects to. */
function target(c: Context, code: ShortCode): string {
  return hostUrl(c, `${code.tenant}.${env.sitesDomain}`, code.path);
}

/** Every short code with its target, for the listing page. */
function listing(c: Context) {
  return Object.entries(codes).map(([name, code]) => ({ name, target: target(c, code) }));
}

app.route("/", commonRoutes);

// Pages render their own <Layout>; the renderer only adds the doctype.
app.use(jsxRenderer(({ children }) => <>{children}</>, { docType: true }));
app.get("/", (c) => c.render(<LinksPage info={laneInfo(c)} codes={listing(c)} />));
app.get("/:code", (c) => {
  const code = codes[c.req.param("code")];
  if (code) return c.redirect(target(c, code), 302);
  c.status(404);
  return c.render(<LinksPage info={laneInfo(c)} codes={listing(c)} missing={c.req.path} />);
});
