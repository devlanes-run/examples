import { serveStatic } from "@hono/node-server/serve-static";
import { dotenvSummary, findDotenv, laneInfo } from "@example-dotenv/config";
import { Hono } from "hono";
import { jsxRenderer } from "hono/jsx-renderer";
import { env } from "./env.js";
import { fetchOrders } from "./orders.js";
import { session } from "./session.js";
import { HomePage } from "./views/HomePage.js";

export const app = new Hono();

app.get("/healthz", (c) => c.text("ok"));
app.get("/lane", (c) => c.json(laneInfo(c, env)));
// brand/ links to _internal/brand, the CSS and logo every example shares. The page loads them
// from assets.<domain>, which devlanes routes to this service too.
app.use("/brand/*", serveStatic({ root: "./" }));
// Built from src/client by tsconfig.client.json.
app.use("/client/*", serveStatic({ root: "./dist" }));

// Pages render their own <Layout>; the renderer only adds the doctype.
app.use(jsxRenderer(({ children }) => <>{children}</>, { docType: true }));
app.get("/", session, async (c) => {
  // Read on every request: the key list follows the file, the values show what this process got.
  const file = findDotenv(env.dotenv);
  const keys = file ? dotenvSummary(file, env.vars) : [];
  return c.render(
    <HomePage info={laneInfo(c, env)} file={file} keys={keys} orders={await fetchOrders()} />,
  );
});

app.notFound((c) => c.text("not found", 404));
