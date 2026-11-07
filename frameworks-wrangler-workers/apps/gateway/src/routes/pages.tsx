import { Hono } from "hono";
import { jsxRenderer } from "hono/jsx-renderer";
import { catalogClient, catalogLaneByHostname } from "../catalog.js";
import { env } from "../env.js";
import { laneInfo } from "../lane.js";
import { HomePage } from "../views/HomePage.js";

/** The lane page. */
export const pageRoutes = new Hono<{ Bindings: Env }>();

// Pages render their own <Layout>; the renderer only adds the doctype.
pageRoutes.use(jsxRenderer(({ children }) => <>{children}</>, { docType: true }));

pageRoutes.get("/", async (c) => {
  const [items, byHostname] = await Promise.all([
    catalogClient(c.env.CATALOG).items(),
    catalogLaneByHostname(env.catalogUrl),
  ]);
  return c.render(<HomePage info={laneInfo(c)} items={items} byHostname={byHostname} />);
});
