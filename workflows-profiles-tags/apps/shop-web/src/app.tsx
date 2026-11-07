import { serveStatic } from "@hono/node-server/serve-static";
import { addRecord, laneInfo, laneRoutes, loadIndex } from "@profiles-tags/shared";
import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { jsxRenderer } from "hono/jsx-renderer";
import { env } from "./env.js";
import { ShopPage } from "./views/ShopPage.js";

export const app = new Hono();

app.route("/", laneRoutes(env));
// brand/ links to _internal/brand, the CSS and logo every example shares.
app.use("/brand/*", serveStatic({ root: "./" }));

app.use(csrf({ origin: env.origins }));
// Pages render their own <Layout>; the renderer only adds the doctype.
app.use(jsxRenderer(({ children }) => <>{children}</>, { docType: true }));

app.get("/", async (c) => {
  const [catalog, accounts] = await Promise.all([loadIndex(env.catalog), loadIndex(env.accounts)]);
  return c.render(<ShopPage info={laneInfo(c, env)} catalog={catalog} accounts={accounts} />);
});
app.post("/users", addRecord(env.accounts, "users"));
