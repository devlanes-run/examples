import { Hono } from "hono";
import { jsxRenderer } from "hono/jsx-renderer";
import { laneInfo } from "../lane.js";
import { HomePage } from "../views/HomePage.js";

/** `GET /` on the main port: the lane page. */
export const pageRoutes = new Hono()
  // Pages render their own <Layout>; the renderer only adds the doctype.
  .use(jsxRenderer(({ children }) => <>{children}</>, { docType: true }))
  .get("/", (c) => c.render(<HomePage info={laneInfo(c, "default")} />));
