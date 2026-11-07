import { serveStatic } from "@hono/node-server/serve-static";
import { addRecord, laneInfo, laneRoutes, loadIndex } from "@profiles-tags/shared";
import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { jsxRenderer } from "hono/jsx-renderer";
import { env } from "./env.js";
import { AdminPage } from "./views/AdminPage.js";

export const app = new Hono();

app.route("/", laneRoutes(env));
// brand/ links to _internal/brand, the CSS and logo every example shares.
app.use("/brand/*", serveStatic({ root: "./" }));

app.use(csrf({ origin: env.origins }));
// Pages render their own <Layout>; the renderer only adds the doctype.
app.use(jsxRenderer(({ children }) => <>{children}</>, { docType: true }));

app.get("/", async (c) => {
  const [accounts, billing, catalog] = await Promise.all([
    loadIndex(env.accounts),
    loadIndex(env.billing),
    loadIndex(env.catalog),
  ]);
  const info = laneInfo(c, env);
  return c.render(
    <AdminPage info={info} accounts={accounts} billing={billing} catalog={catalog} />,
  );
});
app.post("/users", addRecord(env.accounts, "users"));
app.post("/invoices", addRecord(env.billing, "invoices"));
app.post("/products", addRecord(env.catalog, "products"));
