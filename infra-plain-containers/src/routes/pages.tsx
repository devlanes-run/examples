import { Hono } from "hono";
import { jsxRenderer } from "hono/jsx-renderer";
import { serverEnv } from "../env.js";
import { laneInfo } from "../lane.js";
import { providerInfo } from "../oidc.js";
import { getSession } from "../session.js";
import { settle } from "../settle.js";
import { HomePage } from "../views/HomePage.js";
import { whoami } from "../whoami.js";

/** The lane page. */
export const pages = new Hono();

// Pages render their own <Layout>; the renderer only adds the doctype.
pages.use(jsxRenderer(({ children }) => <>{children}</>, { docType: true }));

pages.get("/", async (c) => {
  // Either container can be down or still starting; the page shows the error in its card.
  const [provider, shared] = await Promise.all([settle(providerInfo()), settle(whoami())]);
  return c.render(
    <HomePage
      info={laneInfo(c, serverEnv())}
      claims={getSession(c)?.claims}
      provider={provider}
      shared={shared}
    />,
  );
});
